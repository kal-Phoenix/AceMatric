import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageSquare, 
  Volume2,
  Mic,
  MicOff,
  Headphones,
  VolumeX,
  ChevronLeft,
  CheckSquare
} from 'lucide-react';
import { Subject } from '../../types';
import { db } from '../../lib/supabase';
import { getAccessToken } from '../../lib/authToken';
import { RoomList } from './collaboration';
import { ChatPanel } from './collaboration';
import { WhiteboardCanvas } from './collaboration';
import { SharedNotes } from './collaboration';
import { StudyGoals } from './collaboration';
import { RoomTimer } from './collaboration';
import { QuizChallenge } from './collaboration';
import type { ChatMessage, Member, RoomInfo, CoStudyingPartner } from './collaboration';

interface CollaborationViewProps {
  userProfile: any;
  isPremium: boolean;
  onOpenUpgrade: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export default function CollaborationView({
  userProfile,
  isPremium,
  onOpenUpgrade,
  showToast
}: CollaborationViewProps) {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  // Questions from Supabase
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  useEffect(() => {
    db.getQuestions().then(setAllQuestions).catch(() => {});
  }, []);

  const activeRoomRef = useRef<string | null>(null);
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);
  const [roomMembers, setRoomMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Lobby Search and Subject Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  
  // Modal for Room Creation
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomSubject, setNewRoomSubject] = useState('Mathematics');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  // Extended Room Collaborative States (Synchronized via WebSocket)
  const [goals, setGoals] = useState<any[]>([]);
  const [newGoalText, setNewGoalText] = useState('');
  const [sharedNotes, setSharedNotes] = useState('');
  const [timerState, setTimerState] = useState<any>({ isPlaying: false, timeLeft: 1500, duration: 1500, lastUpdated: Date.now() });

  // Interactive Tools Toggles & Devices
  const [activeVoiceChannel, setActiveVoiceChannel] = useState<string | null>(null);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isLocalVideoOn, setIsLocalVideoOn] = useState(false);
  
  // Sidebar tab for workspace ('checklist' | 'chat' | 'quiz')
  const [activeSidebarTab, setActiveSidebarTab] = useState<'checklist' | 'chat'>('checklist');

  // Study status / sub-task focusing
  const [studyStatusText, setStudyStatusText] = useState('Solving mock exam sets');
  const studyStatusRef = useRef(studyStatusText);
  studyStatusRef.current = studyStatusText;

  // Video refs for webcam streaming
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Quiz drill states
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState(false);
  const [quizScores, setQuizScores] = useState<any[]>([]);
  const quizTimerRef = useRef<any>(null);

  // Connection states
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const connectionReadyRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch Rooms active counts and custom rooms
  const fetchRooms = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch('/api/collaboration/rooms?page=1&limit=100', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setRooms(Array.isArray(data) ? data : (data.rooms || []));
      }
    } catch (e) {
      console.warn('Failed fetching active counts:', e);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 12000);
    return () => clearInterval(interval);
  }, []);

  // Sync study status to other room members
  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !activeRoom) return;
    wsRef.current.send(JSON.stringify({
      type: 'update_member_state',
      studyStatus: studyStatusText
    }));
  }, [studyStatusText, activeRoom]);

  // Cleanup camera stream tracks on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Sync Pomodoro local timer countdown
  useEffect(() => {
    let timerInterval: any = null;
    if (timerState.isPlaying && timerState.timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimerState((prev: any) => {
          if (!prev.isPlaying) return prev;
          const nextVal = Math.max(0, prev.timeLeft - 1);
          if (nextVal === 0) {
            clearInterval(timerInterval);
            showToast('Pomodoro session completed! Time for a well-earned break.', 'success');
            return { ...prev, isPlaying: false, timeLeft: 0 };
          }
          return { ...prev, timeLeft: nextVal };
        });
      }, 1000);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerState.isPlaying]);

  // WebSockets setup with automatic reconnection
  useEffect(() => {
    if (!userProfile?.email) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 10;
    let unmounted = false;

    function connect() {
      if (unmounted) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socketUrl = `${protocol}//${window.location.host}`;

      socket = new WebSocket(socketUrl);
      wsRef.current = socket;
      connectionReadyRef.current = false;

      socket.onopen = () => {
        setIsConnected(true);
        connectionReadyRef.current = true;
        reconnectAttempts = 0;

        const token = getAccessToken();
        socket!.send(JSON.stringify({
          type: 'register',
          token: token
        }));

        if (activeRoomRef.current) {
          socket!.send(JSON.stringify({
            type: 'join_room',
            room: activeRoomRef.current,
            email: userProfile.email,
            name: userProfile.name,
            avatar: userProfile.avatar || '',
            stream: userProfile.stream
          }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'room_error': {
              showToast(data.error || 'Study room limit reached.', 'warning');
              setActiveRoom(null);
              disableCameraTracks();
              break;
            }
            
            case 'room_state': {
              if (data.room === activeRoomRef.current) {
                setRoomMembers(data.members);
                setMessages(data.messages);
                
                if (data.activeQuiz) {
                  setActiveQuiz(data.activeQuiz);
                  const remaining = Math.max(0, Math.ceil((data.activeQuiz.endTime - Date.now()) / 1000));
                  setQuizTimeLeft(remaining);
                } else {
                  setActiveQuiz(null);
                }

                if (data.goals) setGoals(data.goals);
                if (data.sharedNotes !== undefined) setSharedNotes(data.sharedNotes);
                if (data.timerState) setTimerState(data.timerState);
              }
              break;
            }
            
            case 'member_joined': {
              setRoomMembers(prev => {
                if (prev.some(m => m.email === data.member.email)) return prev;
                return [...prev, data.member];
              });
              showToast(`${data.member.name} joined the study room!`, 'info');
              break;
            }
            
            case 'member_left': {
              setRoomMembers(prev => prev.filter(m => m.email !== data.email));
              break;
            }
            
            case 'receive_message': {
              setMessages(prev => [...prev, data.message]);
              scrollToBottom();
              break;
            }
            
            case 'goals_update': {
              setGoals(data.goals);
              break;
            }

            case 'notes_update': {
              setSharedNotes(data.notes);
              break;
            }

            case 'timer_update': {
              setTimerState(data.timerState);
              break;
            }
            
            case 'quiz_started': {
              setActiveQuiz(data.quiz);
              setQuizTimeLeft(Math.max(0, Math.ceil((data.quiz.endTime - Date.now()) / 1000)));
              setSelectedOptionId(null);
              setSubmittedAnswer(false);
              setQuizScores([]);
              setActiveSidebarTab('chat');
              showToast('Group Quiz Challenge Started! Go to Chat/Quiz to answer!', 'info');
              break;
            }
            
            case 'quiz_score_update': {
              setQuizScores(data.scores);
              break;
            }

            case 'quiz_answer_result': {
              if (data.isCorrect) {
                showToast('Brilliant! Correct Answer! +10 Points', 'success');
              } else {
                showToast('Incorrect! Let\'s solve this together.', 'warning');
              }
              break;
            }

            case 'timer_error': {
              showToast(data.error || 'Only the room creator can control the timer.', 'warning');
              break;
            }
            
            case 'new_notification': {
              showToast(`${data.notification.title}: ${data.notification.message}`, 'success');
              break;
            }
          }
        } catch (err) {
          console.error('WS client parser error:', err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        connectionReadyRef.current = false;
        wsRef.current = null;

        if (unmounted) return;
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connect, delay);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      wsRef.current = null;
      connectionReadyRef.current = false;
    };
  }, [userProfile?.email]);

  // Quiz timer counting
  useEffect(() => {
    if (activeQuiz && quizTimeLeft > 0) {
      quizTimerRef.current = setTimeout(() => {
        setQuizTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (quizTimeLeft === 0 && activeQuiz) {
      clearTimeout(quizTimerRef.current);
    }
    return () => clearTimeout(quizTimerRef.current);
  }, [activeQuiz, quizTimeLeft]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeRoom]);

  // Helper to disable video camera tracks
  const disableCameraTracks = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setIsLocalVideoOn(false);
  };

  // Keep local stream bound to video element when rendered or updated
  useEffect(() => {
    if (isLocalVideoOn && localStreamRef.current && localVideoRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(err => {
          console.warn('[Video Play Error]:', err);
        });
      }
    }
  }, [isLocalVideoOn, roomMembers, activeRoom]);

  // Join Room trigger
  const handleJoinRoom = (roomId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !connectionReadyRef.current) {
      showToast('Connecting to real-time study hub... Please wait', 'warning');
      return;
    }
    setActiveRoom(roomId);
    setIsVoiceConnected(false);
    setActiveVoiceChannel(null);
    setIsMuted(false);
    setIsDeafened(false);
    setSubmittedAnswer(false);
    setSelectedOptionId(null);
    setQuizScores([]);
    setActiveQuiz(null);
    disableCameraTracks();
    
    wsRef.current.send(JSON.stringify({
      type: 'join_room',
      room: roomId,
      email: userProfile.email,
      name: userProfile.name,
      avatar: userProfile.avatar || '',
      stream: userProfile.stream
    }));
  };

  const handleLeaveRoom = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_member_state',
        voiceChannel: null,
        videoEnabled: false
      }));
    }
    disableCameraTracks();
    setActiveRoom(null);
    setIsVoiceConnected(false);
    setActiveVoiceChannel(null);
    setRoomMembers([]);
    setMessages([]);
  };

  // Request to Join student-made group
  const handleRequestJoin = async (roomId: string) => {
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/collaboration/rooms/${roomId}/request-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          email: userProfile.email,
          name: userProfile.name,
          avatar: userProfile.avatar || '',
          stream: userProfile.stream
        })
      });
      if (res.ok) {
        showToast('Join request sent successfully to the group creator!', 'success');
        fetchRooms();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Failed to submit join request', 'warning');
      }
    } catch (e) {
      showToast('Connection error. Failed to send request.', 'warning');
    }
  };

  // Approve a student's Request
  const handleApproveRequest = async (roomId: string, studentEmail: string) => {
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/collaboration/rooms/${roomId}/approve-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ email: studentEmail })
      });
      if (res.ok) {
        showToast('Student approved successfully!', 'success');
        fetchRooms();
      } else {
        showToast('Failed to approve request', 'warning');
      }
    } catch (e) {
      showToast('Connection error.', 'warning');
    }
  };

  // Decline a student's Request
  const handleDeclineRequest = async (roomId: string, studentEmail: string) => {
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/collaboration/rooms/${roomId}/reject-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ email: studentEmail })
      });
      if (res.ok) {
        showToast('Decline action processed.', 'info');
        fetchRooms();
      } else {
        showToast('Failed to decline request', 'warning');
      }
    } catch (e) {
      showToast('Connection error.', 'warning');
    }
  };

  // Focusmate Camera Toggle
  const toggleCamera = async () => {
    if (isLocalVideoOn) {
      disableCameraTracks();
      showToast('Camera turned off', 'info');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360, facingMode: 'user' },
          audio: false // audio is processed by voice huddle channels
        });
        localStreamRef.current = stream;
        setIsLocalVideoOn(true);
        showToast('Camera turned on! Showing live face feed.', 'success');

        // Apply stream to local video component
        setTimeout(() => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }, 100);

        // Sync with websocket server
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'update_member_state',
            videoEnabled: true
          }));
        }
      } catch (err) {
        console.warn('[Webcam Access Error]:', err);
        showToast('Could not access camera device or permissions denied.', 'warning');
        setIsLocalVideoOn(false);
      }
    }
  };

  const handleJoinVoiceChannel = (channelId: string) => {
    if (isVoiceConnected && activeVoiceChannel === channelId) {
      handleDisconnectVoice();
    } else {
      setIsVoiceConnected(true);
      setActiveVoiceChannel(channelId);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'update_member_state',
          voiceChannel: channelId
        }));
      }
      showToast(`Connected to Voice Huddle`, 'success');
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_member_state',
        isMuted: nextMute
      }));
    }
  };

  const handleToggleDeafen = () => {
    const nextDeafen = !isDeafened;
    setIsDeafened(nextDeafen);
    const nextMute = nextDeafen ? true : isMuted;
    if (nextDeafen) {
      setIsMuted(true);
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_member_state',
        isDeafened: nextDeafen,
        isMuted: nextMute
      }));
    }
  };

  const handleDisconnectVoice = () => {
    setIsVoiceConnected(false);
    setActiveVoiceChannel(null);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_member_state',
        voiceChannel: null
      }));
    }
    showToast('Disconnected from voice channel', 'info');
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'send_message',
      text: inputText.trim()
    }));
    setInputText('');
  };

  // Trigger group quiz drill challenge
  const handleTriggerQuiz = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    const subjectMapping: Record<string, Subject> = {
      'Physics': 'Physics',
      'Mathematics': 'Mathematics',
      'Chemistry': 'Chemistry',
      'Biology': 'Biology',
      'Economics': 'Economics',
      'English': 'English',
      'Aptitude': 'SAT',
      'SAT': 'SAT'
    };
    const targetSubj = subjectMapping[activeRoomDetail?.subject || ''] || 'Physics';
    
    const subjectQuestions = allQuestions.filter(q => q.subject === targetSubj);
    if (subjectQuestions.length === 0) {
      showToast('No exam questions available for this subject!', 'warning');
      return;
    }
    
    const randomQuestion = subjectQuestions[Math.floor(Math.random() * subjectQuestions.length)];
    
    wsRef.current.send(JSON.stringify({
      type: 'trigger_quiz',
      question: {
        id: randomQuestion.id,
        subject: randomQuestion.subject,
        questionText: randomQuestion.questionText,
        options: randomQuestion.options,
        correctOptionId: randomQuestion.correctOptionId
      }
    }));
  };

  // Submit answer
  const handleSubmitAnswer = (optionId: string) => {
    if (!activeQuiz || submittedAnswer || !wsRef.current) return;
    
    setSelectedOptionId(optionId);
    setSubmittedAnswer(true);
    
    wsRef.current.send(JSON.stringify({
      type: 'submit_quiz_answer',
      questionId: activeQuiz.questionId,
      selectedOptionId: optionId,
    }));
  };

  // Create custom study group
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      showToast('Please specify a valid study group name.', 'warning');
      return;
    }
    try {
      const token = getAccessToken();
      const res = await fetch('/api/collaboration/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          name: newRoomName.trim(),
          subject: newRoomSubject,
          description: newRoomDesc.trim(),
          creatorEmail: userProfile?.email || 'anonymous',
          creatorName: userProfile?.name || 'Anonymous'
        })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Room "${data.name}" opened! Entering workspace...`, 'success');
        
        await fetchRooms();
        setIsCreatingRoom(false);
        setNewRoomName('');
        setNewRoomDesc('');
        
        handleJoinRoom(data.id);
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to create room.', 'warning');
      }
    } catch (err) {
      console.error('[Create Room Error]:', err);
      showToast('Could not establish connection to create room.', 'warning');
    }
  };

  // Shared checklist handlers
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({
      type: 'add_goal',
      text: newGoalText.trim(),
      setter: userProfile?.name || 'Partner'
    }));
    setNewGoalText('');
  };

  const handleToggleGoal = (id: string) => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({
      type: 'toggle_goal',
      id
    }));
  };

  const handleDeleteGoal = (id: string) => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({
      type: 'delete_goal',
      id
    }));
  };

  // Shared Notes change
  const handleNotesChange = (text: string) => {
    setSharedNotes(text);
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({
      type: 'update_notes',
      notes: text
    }));
  };

  // Timer control trigger
  const handleTimerControl = (action: 'start' | 'pause' | 'reset', customDuration?: number) => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({
      type: 'timer_control',
      action,
      duration: customDuration,
      timeLeft: timerState.timeLeft
    }));
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.subject.toLowerCase().includes(searchQuery.toLowerCase());
        
      if (selectedSubjectFilter === 'All') return matchesSearch;
      if (selectedSubjectFilter === 'Custom') return matchesSearch && room.id.startsWith('custom-');
      return matchesSearch && room.subject.toLowerCase().includes(selectedSubjectFilter.toLowerCase());
    });
  }, [rooms, searchQuery, selectedSubjectFilter]);

  const activeRoomDetail = useMemo(() => {
    return rooms.find(r => r.id === activeRoom);
  }, [rooms, activeRoom]);

  const myCreatedRoomsWithRequests = useMemo(() => {
    return rooms.filter(room => 
      room.creatorEmail.trim().toLowerCase() === (userProfile?.email || '').trim().toLowerCase() && 
      room.joinRequests && room.joinRequests.length > 0
    );
  }, [rooms, userProfile]);

  // Real WS-connected members displayed in the study grid
  const coStudyingPartners = useMemo(() => {
    if (!activeRoomDetail) return [];

    return roomMembers.map(m => {
      const isMe = m.email.toLowerCase() === (userProfile?.email || '').toLowerCase();
      return {
        email: m.email,
        name: m.name,
        avatar: m.avatar || '',
        isMe,
        videoEnabled: isMe ? isLocalVideoOn : !!m.videoEnabled,
        isMuted: isMe ? isMuted : !!m.isMuted,
        isDeafened: isMe ? isDeafened : !!m.isDeafened,
        subject: activeRoomDetail.subject,
        status: isMe ? studyStatusText : (m.studyStatus || 'Studying'),
        stream: m.stream || 'Natural Science'
      };
    });
  }, [roomMembers, userProfile, activeRoomDetail, isLocalVideoOn, isMuted, isDeafened, studyStatusText]);

  // Format timer
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex h-[680px] max-h-[85vh] md:h-[720px] md:max-h-[80vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-sm relative text-slate-200 font-sans">
      
      {!activeRoomDetail ? (
        /* ================= LOBBY & DIRECTORY VIEW ================= */
        <RoomList
          rooms={rooms}
          userProfile={userProfile}
          showToast={showToast}
          filteredRooms={filteredRooms}
          myCreatedRoomsWithRequests={myCreatedRoomsWithRequests}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedSubjectFilter={selectedSubjectFilter}
          setSelectedSubjectFilter={setSelectedSubjectFilter}
          handleJoinRoom={handleJoinRoom}
          handleRequestJoin={handleRequestJoin}
          handleApproveRequest={handleApproveRequest}
          handleDeclineRequest={handleDeclineRequest}
          isCreatingRoom={isCreatingRoom}
          setIsCreatingRoom={setIsCreatingRoom}
          newRoomName={newRoomName}
          setNewRoomName={setNewRoomName}
          newRoomSubject={newRoomSubject}
          setNewRoomSubject={setNewRoomSubject}
          newRoomDesc={newRoomDesc}
          setNewRoomDesc={setNewRoomDesc}
          handleCreateRoom={handleCreateRoom}
        />
      ) : (
        /* ================= NEW FOCUSMATE-INSPIRED STUDY WORKSPACE ================= */
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/60">
          
          {/* Top Session Hub Header */}
          <div className="h-14 border-b border-slate-850 px-4 flex items-center justify-between shrink-0 bg-slate-900 z-10 shadow-sm relative">
            {/* Horizontal Pomodoro Progress bar track */}
            <div className="absolute bottom-0 left-0 h-[2px] bg-slate-850 w-full">
              <div 
                style={{ width: `${(timerState.timeLeft / (timerState.duration || 1500)) * 100}%` }} 
                className={`h-full transition-all duration-1000 ${
                  timerState.isPlaying 
                    ? 'bg-indigo-500' 
                    : 'bg-indigo-500/20'
                }`}
              ></div>
            </div>

            {/* Left Back Info */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleLeaveRoom}
                className="p-1.5 rounded-full bg-slate-950/80 border border-slate-800/80 text-slate-450 hover:text-rose-400 hover:bg-rose-950/30 hover:border-rose-500/30 transition-all duration-200 cursor-pointer active:scale-90 shadow-sm"
                title="Leave Session"
                aria-label="Leave session"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-white tracking-wide truncate max-w-[150px] sm:max-w-xs">{activeRoomDetail.name}</h3>
                  <span className="px-1.5 py-0.5 rounded bg-slate-950 text-xs font-bold text-indigo-400 border border-slate-850 uppercase shrink-0">
                    {activeRoomDetail.subject}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-xs font-mono font-bold shrink-0">
                    {coStudyingPartners.length}/10 Studying
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-xs text-slate-450 font-semibold">Focusmate Mode Active • Video Match Enabled</span>
                </div>
              </div>
            </div>

            {/* Right: Integrated Pomodoro Timer & Voice Huddle Panel */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              <RoomTimer
                timerState={timerState}
                handleTimerControl={handleTimerControl}
                formatTime={formatTime}
              />

              {/* Voice Huddle System */}
              <div className="flex items-center gap-1 px-1.5 py-0.5 sm:py-1 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <button
                  onClick={() => handleJoinVoiceChannel('voice-1')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    isVoiceConnected 
                      ? 'bg-emerald-600 text-white shadow-sm font-semibold' 
                      : 'bg-slate-900/90 text-slate-450 hover:text-white border border-slate-800/50 hover:bg-slate-800'
                  }`}
                  aria-label={isVoiceConnected ? 'Disconnect from voice channel' : 'Join voice channel'}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isVoiceConnected ? 'Connected' : 'Voice'}</span>
                </button>

                {isVoiceConnected && (
                  <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5">
                    <button
                      onClick={handleToggleMute}
                      className={`p-1 rounded-md hover:bg-slate-850 transition-all cursor-pointer active:scale-90 ${isMuted ? 'text-rose-450 bg-rose-500/10' : 'text-emerald-400 hover:text-emerald-300'}`}
                      title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                      aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    >
                      {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={handleToggleDeafen}
                      className={`p-1 rounded-md hover:bg-slate-850 transition-all cursor-pointer active:scale-90 ${isDeafened ? 'text-amber-450 bg-amber-500/10' : 'text-indigo-400 hover:text-indigo-300'}`}
                      title={isDeafened ? 'Undeafen Audio' : 'Deafen Audio'}
                      aria-label={isDeafened ? 'Undeafen audio' : 'Deafen audio'}
                    >
                      {isDeafened ? <VolumeX className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Core Screen Split */}
          <div className="flex-1 min-h-0 flex flex-col md:flex-row">
            
            <WhiteboardCanvas
              coStudyingPartners={coStudyingPartners}
              isLocalVideoOn={isLocalVideoOn}
              toggleCamera={toggleCamera}
              isMuted={isMuted}
              handleToggleMute={handleToggleMute}
              isDeafened={isDeafened}
              handleToggleDeafen={handleToggleDeafen}
              localVideoRef={localVideoRef}
              studyStatusText={studyStatusText}
              setStudyStatusText={setStudyStatusText}
              activeRoomDetail={activeRoomDetail}
            />

            {/* COLUMN 2 (40%): LIVE HUDDLE SIDEBAR (Chat, Shared Notes, Quiz) */}
            <div className="md:w-2/5 min-h-0 flex flex-col bg-slate-950/20">
              
              {/* Tab Toggles for utility area */}
              <div className="p-2 border-b border-slate-850 bg-slate-900 shrink-0 flex gap-2">
                <button
                  onClick={() => setActiveSidebarTab('checklist')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-250 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    activeSidebarTab === 'checklist'
                      ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500/20'
                      : 'text-slate-450 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Goals & Pad</span>
                </button>
                <button
                  onClick={() => setActiveSidebarTab('chat')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-250 flex items-center justify-center gap-1.5 cursor-pointer relative active:scale-95 ${
                    activeSidebarTab === 'chat'
                      ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500/20'
                      : 'text-slate-450 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat & Quiz</span>
                  {activeQuiz && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-900"></span>
                  )}
                </button>
              </div>

              {activeSidebarTab === 'checklist' ? (
                /* GOALS & COLLABORATIVE NOTE PAD TAB */
                <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto min-h-0">
                  
                  <StudyGoals
                    goals={goals}
                    newGoalText={newGoalText}
                    setNewGoalText={setNewGoalText}
                    handleAddGoal={handleAddGoal}
                    handleToggleGoal={handleToggleGoal}
                    handleDeleteGoal={handleDeleteGoal}
                  />

                  <SharedNotes
                    sharedNotes={sharedNotes}
                    handleNotesChange={handleNotesChange}
                  />

                </div>
              ) : (
                /* CHAT & ACTIVE DRILL TAB */
                <div className="flex-1 flex flex-col min-h-0 bg-slate-950/20">
                  
                  <QuizChallenge
                    activeQuiz={activeQuiz}
                    quizTimeLeft={quizTimeLeft}
                    selectedOptionId={selectedOptionId}
                    submittedAnswer={submittedAnswer}
                    quizScores={quizScores}
                    questions={allQuestions}
                    handleSubmitAnswer={handleSubmitAnswer}
                    handleTriggerQuiz={handleTriggerQuiz}
                  />

                  <ChatPanel
                    messages={messages}
                    inputText={inputText}
                    setInputText={setInputText}
                    handleSendMessage={handleSendMessage}
                    messagesEndRef={messagesEndRef}
                  />

                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
