import { Award, Download, Share2 } from 'lucide-react';

interface AchievementCertificateProps {
  userName: string;
  score: number;
  subjectsCompleted: number;
  totalStudyHours: number;
  rank?: string;
  onClose?: () => void;
}

export default function AchievementCertificate({
  userName,
  score,
  subjectsCompleted,
  totalStudyHours,
  rank,
  onClose,
}: AchievementCertificateProps) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 850;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0A0E14';
    ctx.fillRect(0, 0, 1200, 850);

    // Border
    ctx.strokeStyle = '#14B8A6';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1140, 790);

    // Inner border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, 1120, 770);

    // Header
    ctx.fillStyle = '#2DD4BF';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ACEMATRIC', 600, 100);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Arial';
    ctx.fillText('Ethiopian Grade 12 National Exam Preparation', 600, 130);

    // Certificate title
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 42px Arial';
    ctx.fillText('Certificate of Achievement', 600, 220);

    // Decorative line
    const gradient = ctx.createLinearGradient(400, 0, 800, 0);
    gradient.addColorStop(0, '#14B8A6');
    gradient.addColorStop(0.5, '#10B981');
    gradient.addColorStop(1, '#06B6D4');
    ctx.fillStyle = gradient;
    ctx.fillRect(400, 240, 400, 3);

    // Presented to
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Arial';
    ctx.fillText('This certificate is proudly presented to', 600, 300);

    // Name
    ctx.fillStyle = '#2DD4BF';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(userName, 600, 370);

    // Under name line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(350, 390);
    ctx.lineTo(850, 390);
    ctx.stroke();

    // Stats
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Arial';
    ctx.fillText('For outstanding performance in matric exam preparation', 600, 430);

    // Stats boxes
    const boxY = 470;
    const boxWidth = 200;
    const boxHeight = 90;
    const boxGap = 30;
    const startX = 600 - (3 * boxWidth + 2 * boxGap) / 2;

    const stats = [
      { label: 'Readiness Score', value: `${score}%` },
      { label: 'Subjects Covered', value: `${subjectsCompleted}` },
      { label: 'Study Hours', value: `${totalStudyHours}h` },
    ];

    stats.forEach((stat, i) => {
      const x = startX + i * (boxWidth + boxGap);

      ctx.fillStyle = '#141920';
      ctx.beginPath();
      ctx.roundRect(x, boxY, boxWidth, boxHeight, 12);
      ctx.fill();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, boxY, boxWidth, boxHeight, 12);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(stat.label.toUpperCase(), x + boxWidth / 2, boxY + 30);

      ctx.fillStyle = '#2DD4BF';
      ctx.font = 'bold 28px Arial';
      ctx.fillText(stat.value, x + boxWidth / 2, boxY + 65);
    });

    // Rank badge
    if (rank) {
      ctx.fillStyle = '#141920';
      ctx.beginPath();
      ctx.roundRect(450, 600, 300, 50, 12);
      ctx.fill();
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(` National Rank: ${rank}`, 600, 632);
    }

    // Date
    ctx.fillStyle = '#475569';
    ctx.font = '13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Issued on ${date}`, 600, 700);

    // Footer
    ctx.fillStyle = '#334155';
    ctx.font = '11px Arial';
    ctx.fillText('© 2026 AceMatric — Consistency Over Intensity', 600, 780);

    // Download
    const link = document.createElement('a');
    link.download = `AceMatric-Certificate-${userName.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShare = () => {
    const text = `I just earned an AceMatric Certificate of Achievement!\n\nScore: ${score}%\nSubjects: ${subjectsCompleted}\nStudy Hours: ${totalStudyHours}h\n\n#AceMatric #EthiopianStudents #MatricExam`;
    if (navigator.share) {
      navigator.share({ title: 'My AceMatric Achievement', text });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141920] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full">
        {/* Certificate Preview */}
        <div className="bg-[#0A0E14] p-8 text-center space-y-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-blue-400">AceMatric</div>
          <h2 className="text-2xl font-semibold text-white">Certificate of Achievement</h2>
          <div className="w-32 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 mx-auto" />
          <p className="text-xs text-slate-400">This certificate is proudly presented to</p>
          <h3 className="text-3xl font-semibold text-blue-400">{userName}</h3>
          <p className="text-xs text-slate-400">For outstanding performance in matric exam preparation</p>

          <div className="flex justify-center gap-4 pt-2">
            <div className="text-center">
              <div className="text-2xl font-semibold text-white">{score}%</div>
              <div className="text-xs text-slate-500 uppercase">Readiness</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-white">{subjectsCompleted}</div>
              <div className="text-xs text-slate-500 uppercase">Subjects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-white">{totalStudyHours}h</div>
              <div className="text-xs text-slate-500 uppercase">Study Time</div>
            </div>
          </div>

          {rank && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <span className="text-amber-400 text-sm font-semibold"> Rank: {rank}</span>
            </div>
          )}

          <p className="text-xs text-slate-500 pt-2">Issued on {date}</p>
        </div>

        {/* Actions */}
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
