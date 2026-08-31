import { useRef, useState, type ChangeEvent } from 'react';
import { Image as ImageIcon, Loader2, Play, Scan } from 'lucide-react';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&h=480&fit=crop';

interface VisualEntity {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const MOCK_DETECTIONS: VisualEntity[] = [
  { id: 'e1', label: '图表区域', x: 8, y: 12, w: 52, h: 38, color: '#3b82f6' },
  { id: 'e2', label: '坐标轴', x: 10, y: 48, w: 48, h: 8, color: '#10b981' },
  { id: 'e3', label: '图例', x: 58, y: 14, w: 28, h: 22, color: '#8b5cf6' },
  { id: 'e4', label: '标注文字', x: 62, y: 58, w: 30, h: 12, color: '#f59e0b' },
];

export default function VisualEntityLocalizationPage() {
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [fileName, setFileName] = useState('sample-diagram.jpg');
  const [running, setRunning] = useState(false);
  const [entities, setEntities] = useState<VisualEntity[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setHasRun(false);
    setEntities([]);
  };

  const localize = () => {
    setRunning(true);
    setHasRun(false);
    setTimeout(() => {
      setEntities(MOCK_DETECTIONS);
      setHasRun(true);
      setRunning(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Scan className="w-5 h-5 text-emerald-600" />
          <h1 className="text-lg font-semibold text-gray-900">视觉实体定位</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          接口演示：输入图像，输出框选实体区域后的定位结果。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-gray-100 font-mono">POST</span> 输入 · image
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
                onClick={localize}
                disabled={running}
                className="text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg flex items-center gap-1.5"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                调用定位接口
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <Scan size={13} className="text-emerald-500" /> 输出 · boxes
            </div>
            <div className="p-4 flex-1 space-y-4">
              {!hasRun && !running && (
                <p className="text-sm text-gray-400 text-center py-12">框选结果将显示在此处</p>
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
                    {entities.map(box => (
                      <div
                        key={box.id}
                        className="absolute border-2 rounded-sm pointer-events-none"
                        style={{
                          left: `${box.x}%`,
                          top: `${box.y}%`,
                          width: `${box.w}%`,
                          height: `${box.h}%`,
                          borderColor: box.color,
                          boxShadow: `0 0 0 1px ${box.color}33`,
                        }}
                      >
                        <span
                          className="absolute -top-5 left-0 text-[10px] px-1 py-0.5 rounded text-white whitespace-nowrap"
                          style={{ backgroundColor: box.color }}
                        >
                          {box.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-100">
                        <th className="text-left py-2 font-medium">实体</th>
                        <th className="text-left py-2 font-medium">bbox (归一化)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {entities.map(box => (
                        <tr key={box.id}>
                          <td className="py-2 font-medium text-gray-800">{box.label}</td>
                          <td className="py-2 font-mono text-gray-500 tabular-nums">
                            x={box.x.toFixed(0)} y={box.y.toFixed(0)} w={box.w.toFixed(0)} h={box.h.toFixed(0)}
                          </td>
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
