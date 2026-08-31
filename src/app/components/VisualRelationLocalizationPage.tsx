import { useRef, useState, type ChangeEvent } from 'react';
import { Image as ImageIcon, Link2, Loader2, Play } from 'lucide-react';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&h=480&fit=crop';

interface VisualRelation {
  id: string;
  subject: string;
  object: string;
  predicate: string;
  sx: number; sy: number; sw: number; sh: number;
  ox: number; oy: number; ow: number; oh: number;
  score: number;
}

const MOCK_VISUAL_RELATIONS: VisualRelation[] = [
  {
    id: 'vr1', subject: '主图表', object: '坐标轴', predicate: 'above',
    sx: 12, sy: 10, sw: 45, sh: 35, ox: 15, oy: 52, ow: 40, oh: 10, score: 0.91,
  },
  {
    id: 'vr2', subject: '图例', object: '主图表', predicate: 'describes',
    sx: 62, sy: 12, sw: 28, sh: 20, ox: 30, oy: 25, ow: 20, oh: 15, score: 0.84,
  },
  {
    id: 'vr3', subject: '标注文字', object: '主图表', predicate: 'labels',
    sx: 58, sy: 58, sw: 32, sh: 12, ox: 35, oy: 38, ow: 15, oh: 10, score: 0.78,
  },
];

const PREDICATE_ZH: Record<string, string> = {
  above: '位于上方',
  describes: '描述',
  labels: '标注',
};

export default function VisualRelationLocalizationPage() {
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [fileName, setFileName] = useState('figure-relations.jpg');
  const [running, setRunning] = useState(false);
  const [relations, setRelations] = useState<VisualRelation[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setHasRun(false);
    setRelations([]);
  };

  const detect = () => {
    setRunning(true);
    setHasRun(false);
    setTimeout(() => {
      setRelations(MOCK_VISUAL_RELATIONS);
      setHasRun(true);
      setRunning(false);
    }, 800);
  };

  const boxCenter = (x: number, y: number, w: number, h: number) => ({
    cx: x + w / 2,
    cy: y + h / 2,
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Link2 className="w-5 h-5 text-rose-600" />
          <h1 className="text-lg font-semibold text-gray-900">视觉关系定位</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          接口演示：输入图像，检测物体间视觉关系（空间/语义谓词）。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-600">
              <span className="px-1.5 py-0.5 rounded bg-gray-100 font-mono mr-1.5">POST</span> 输入 · image
            </div>
            <div className="p-4 space-y-3">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1"
              >
                <ImageIcon size={12} /> 上传图像
              </button>
              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-[4/3]">
                <img src={imageUrl} alt="输入" className="w-full h-full object-cover" />
              </div>
              <p className="text-[11px] text-gray-400 truncate">{fileName}</p>
              <button
                type="button"
                onClick={detect}
                disabled={running}
                className="text-sm px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-lg flex items-center gap-1.5"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                调用视觉关系检测接口
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <Link2 size={13} className="text-rose-500" /> 输出 · visual_relations
            </div>
            <div className="p-4 space-y-4">
              {!hasRun && !running && (
                <p className="text-sm text-gray-400 text-center py-12">视觉关系将显示在此处</p>
              )}
              {running && (
                <p className="text-sm text-gray-400 text-center py-12 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> 检测中…
                </p>
              )}
              {hasRun && (
                <>
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-[4/3]">
                    <img src={imageUrl} alt="输出" className="w-full h-full object-cover" />
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {relations.map(r => {
                        const s = boxCenter(r.sx, r.sy, r.sw, r.sh);
                        const o = boxCenter(r.ox, r.oy, r.ow, r.oh);
                        return (
                          <g key={r.id}>
                            <line x1={s.cx} y1={s.cy} x2={o.cx} y2={o.cy} stroke="#f43f5e" strokeWidth="0.4" strokeDasharray="2 1" />
                          </g>
                        );
                      })}
                    </svg>
                    {relations.flatMap(r => [
                      { label: r.subject, x: r.sx, y: r.sy, w: r.sw, h: r.sh, color: '#3b82f6' },
                      { label: r.object, x: r.ox, y: r.oy, w: r.ow, h: r.oh, color: '#10b981' },
                    ]).map((box, i) => (
                      <div
                        key={i}
                        className="absolute border-2 rounded-sm pointer-events-none"
                        style={{
                          left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`,
                          borderColor: box.color,
                        }}
                      >
                        <span className="absolute -top-4 left-0 text-[9px] px-1 rounded text-white whitespace-nowrap" style={{ backgroundColor: box.color }}>
                          {box.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-100">
                        <th className="text-left py-2 font-medium">主体</th>
                        <th className="text-left py-2 font-medium">关系</th>
                        <th className="text-left py-2 font-medium">客体</th>
                        <th className="text-right py-2 font-medium">置信度</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {relations.map(r => (
                        <tr key={r.id}>
                          <td className="py-2 font-medium text-gray-800">{r.subject}</td>
                          <td className="py-2 text-rose-700">{PREDICATE_ZH[r.predicate] ?? r.predicate}</td>
                          <td className="py-2 font-medium text-gray-800">{r.object}</td>
                          <td className="py-2 text-right tabular-nums text-gray-600">{(r.score * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
