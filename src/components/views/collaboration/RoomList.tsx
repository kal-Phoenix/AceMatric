import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus,
  Compass,
  ArrowRight,
  PlusCircle,
  Check,
  X,
  Laptop,
  CheckSquare,
  Trash2
} from 'lucide-react';
import { RoomInfo } from './interfaces';

interface RoomListProps {
  rooms: RoomInfo[];
  userProfile: any;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
  filteredRooms: RoomInfo[];
  myCreatedRoomsWithRequests: RoomInfo[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedSubjectFilter: string;
  setSelectedSubjectFilter: (f: string) => void;
  handleJoinRoom: (roomId: string) => void;
  handleRequestJoin: (roomId: string) => void;
  handleApproveRequest: (roomId: string, studentEmail: string) => void;
  handleDeclineRequest: (roomId: string, studentEmail: string) => void;
  handleDeleteRoom: (roomId: string) => void;
  isCreatingRoom: boolean;
  setIsCreatingRoom: (v: boolean) => void;
  newRoomName: string;
  setNewRoomName: (v: string) => void;
  newRoomSubject: string;
  setNewRoomSubject: (v: string) => void;
  newRoomDesc: string;
  setNewRoomDesc: (v: string) => void;
  handleCreateRoom: (e: React.FormEvent) => void;
}

export default function RoomList({
  rooms,
  userProfile,
  showToast,
  filteredRooms,
  myCreatedRoomsWithRequests,
  searchQuery,
  setSearchQuery,
  selectedSubjectFilter,
  setSelectedSubjectFilter,
  handleJoinRoom,
  handleRequestJoin,
  handleApproveRequest,
  handleDeclineRequest,
  handleDeleteRoom,
  isCreatingRoom,
  setIsCreatingRoom,
  newRoomName,
  setNewRoomName,
  newRoomSubject,
  setNewRoomSubject,
  newRoomDesc,
  setNewRoomDesc,
  handleCreateRoom
}: RoomListProps) {
  const isAdmin = userProfile?.role === 'admin';

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950/40 animate-in fade-in duration-200">
        
        {/* Lobby Onboarding Banner */}
        <div className="p-6 border-b border-slate-850 bg-slate-900/60 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Laptop className="w-5 h-5 text-indigo-400" />
                Live Face-to-Face Peer Co-Study Rooms (Max 10 per group)
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Study side-by-side with national Grade 12 students in a secure virtual library. Show your face, use your microphone, set active task lists, and co-focus peacefully just like <b>Focusmate</b>.
              </p>
            </div>
            <button
              onClick={() => setIsCreatingRoom(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Launch Private Circle
            </button>
          </div>
        </div>

        {/* Lobby Browser Controls */}
        <div className="px-6 py-4 bg-slate-900/20 border-b border-slate-850 shrink-0 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search study groups..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {['All', 'Physics', 'Mathematics', 'Chemistry', 'Aptitude', 'Custom'].map((filterTab) => (
              <button
                key={filterTab}
                onClick={() => setSelectedSubjectFilter(filterTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 border ${
                  selectedSubjectFilter === filterTab
                    ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-sm'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-450 hover:text-slate-200 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {filterTab} {filterTab === 'Custom' ? 'Groups' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Pending Join Requests Dashboard for Creators */}
          {myCreatedRoomsWithRequests.length > 0 && (
            <div className="mb-6 p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-2 text-amber-400 mb-3">
                <Users className="w-5 h-5" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Join Requests for your Groups</h3>
                <span className="text-xs bg-amber-500/25 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  {myCreatedRoomsWithRequests.reduce((acc, r) => acc + (r.joinRequests?.length || 0), 0)} PENDING
                </span>
              </div>
              
              <div className="space-y-3">
                {myCreatedRoomsWithRequests.map(room => (
                  <div key={room.id} className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                      Group: <span className="text-indigo-400">{room.name}</span> ({room.subject})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {room.joinRequests.map(req => (
                        <div key={req.email} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{req.avatar || ''}</span>
                            <div>
                              <div className="text-xs font-bold text-white leading-none">{req.name}</div>
                              <div className="text-xs text-slate-500">{req.stream || 'Natural Science'}</div>
                              <div className="text-xs text-indigo-400 leading-none mt-1 truncate max-w-[150px]">{req.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproveRequest(room.id, req.email)}
                              className="p-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                              title="Approve Request"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(room.id, req.email)}
                              className="p-1.5 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                              title="Decline Request"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => {
              const progressPct = room.goalsCount > 0 
                ? Math.round((room.completedGoalsCount / room.goalsCount) * 100) 
                : 0;

              let icon = '';
              const subj = room.subject.toLowerCase();
              if (subj.includes('math')) icon = '';
              else if (subj.includes('phys')) icon = '';
              else if (subj.includes('chem')) icon = '';
              else if (subj.includes('apt')) icon = '';

              const isCreator = room.creatorEmail.trim().toLowerCase() === (userProfile?.email || '').trim().toLowerCase();
              const isApproved = isCreator || (room.allowedEmails && room.allowedEmails.some(email => email.trim().toLowerCase() === (userProfile?.email || '').trim().toLowerCase()));
              const hasRequested = room.joinRequests && room.joinRequests.some(req => req.email.trim().toLowerCase() === (userProfile?.email || '').trim().toLowerCase());
              const isFull = room.activeCount >= 10;
              const canDelete = isCreator || isAdmin;

              return (
                <div
                  key={room.id}
                  onClick={() => {
                    if (isApproved) {
                      if (isFull) {
                        showToast('Study group is currently full (Max 10 limit reached). Use another group or launch a new circle!', 'warning');
                      } else {
                        handleJoinRoom(room.id);
                      }
                    } else if (hasRequested) {
                      showToast('Your join request is pending group creator approval.', 'info');
                    } else if (isFull) {
                      showToast('This group is currently full. No join requests can be submitted.', 'warning');
                    } else {
                      handleRequestJoin(room.id);
                    }
                  }}
                  className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-48 group shadow-md relative overflow-hidden hover:-translate-y-1 active:scale-[0.98] ${
                    isFull && !isApproved
                      ? 'bg-slate-950/20 border-rose-950 opacity-70 cursor-not-allowed'
                      : isApproved
                        ? 'bg-slate-900/95 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850/50 hover:shadow-sm'
                        : hasRequested
                          ? 'bg-slate-900/70 border-amber-500/30 hover:bg-slate-900/90 hover:shadow-sm'
                          : 'bg-slate-900/90 border-slate-850 hover:border-indigo-500/40 hover:bg-slate-850/45 hover:shadow-sm'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all pointer-events-none"></div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{icon}</span>
                      <div className="flex items-center gap-1.5">
                        {isCreator && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-black tracking-wider uppercase">
                            Creator
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 border ${
                          isFull 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                            : 'bg-indigo-500/10 border-indigo-500/15 text-indigo-400'
                        }`}>
                          <Users className="w-3 h-3" />
                          <span>{room.activeCount}/10 MEMBERS</span>
                          {isFull && <span className="ml-1 text-xs tracking-wide text-rose-500 uppercase font-black">(FULL)</span>}
                        </span>

                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete the study group "${room.name}"?`)) {
                                handleDeleteRoom(room.id);
                              }
                            }}
                            className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 transition-all cursor-pointer"
                            title="Delete Study Room"
                            aria-label={`Delete study room ${room.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-3 group-hover:text-indigo-400 transition-colors truncate">
                      {room.name}
                    </h3>
                    <p className="text-xs text-slate-450 mt-1 leading-relaxed line-clamp-2">
                      {room.description || `Study circles for standard exam questions.`}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-3">
                    {room.goalsCount > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold uppercase text-slate-500">
                          <span>Shared Goals</span>
                          <span>{room.completedGoalsCount}/{room.goalsCount} Solved</span>
                        </div>
                        <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                          <div style={{ width: `${progressPct}%` }} className="h-full bg-emerald-500 transition-all"></div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 bg-slate-950 rounded text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {room.subject}
                      </span>
                      
                      {isApproved ? (
                        <span className="text-xs font-bold flex items-center gap-0.5 text-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity">
                          <span>Enter Group</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      ) : hasRequested ? (
                        <span className="text-xs font-bold flex items-center gap-1 text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/15">
                          <span>Pending...</span>
                        </span>
                      ) : isFull ? (
                        <span className="text-xs font-bold flex items-center gap-0.5 text-slate-500">
                          <span>Full</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold flex items-center gap-0.5 text-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity bg-emerald-500/5 px-2.5 py-0.5 rounded border border-emerald-500/15">
                          <span>Ask to Join</span>
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRooms.length === 0 && (
              <div className="col-span-full py-16 text-center rounded-xl bg-slate-900 border border-slate-800">
                <Compass className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-300">No matching study groups found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Launch a custom academic peer group or change the filter keywords to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {isCreatingRoom && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-5 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                Launch Academic Study Group
              </h3>
              <p className="text-xs text-slate-400 mt-1">Specify room details to open a collaborative workspace with your partners. Max 10 students.</p>
            </div>

            <form onSubmit={handleCreateRoom} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Group Name</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Mathematics Past Paper Review 2016"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 focus:outline-hidden focus:border-indigo-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject Specialty</label>
                <select
                  value={newRoomSubject}
                  onChange={(e) => setNewRoomSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 focus:outline-hidden focus:border-indigo-500/40"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="English">English</option>
                  <option value="SAT">Aptitude</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Short Description</label>
                <textarea
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="e.g. Cooperative past papers review, solving limits, derivatives and sequence puzzles."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 focus:outline-hidden focus:border-indigo-500/40 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-800 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreatingRoom(false)}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850 rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  Launch Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
