import { useRef, useState, type ChangeEvent } from 'react';
import { Image as ImageIcon, Layers, Loader2, Play } from 'lucide-react';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=640&h=480&fit=crop';

const SCENE_PRESETS: Record<string, { label: string; score: number }[]> = {
  default: [
    { label: '实验室 / 科研场景', score: 0.91 },
    { label: '显微镜 / 精密仪器', score: 0.76 },
    { label: '工业检测场景', score: 0.42 },
    { label: '医疗影像场景', score: 0.28 },
  ],
  indoor: [
    { label: '室内办公场景', score: 0.88 },
    { label: '会议 / 协作场景', score: 0.61 },
    { label: '数据中心', score: 0.35 },
  ],
  outdoor: [
    { label: '户外自然场景', score: 0.93 },
    { label: '遥感 / 地理场景', score: 0.54 },
    { label: '交通 / 城市街景', score: 0.31 },
  ],
};

export default function VisualConceptLocalizationPage() {
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [fileName, setFileName] = useState('lab-scene.jpg');
  const [running, setRunning] = useState(false);
  const [scenes, setScenes] = useState<{ label: string; score: number }[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setHasRun(false);
    setScenes([]);
  };

  const classify = () => {
    setRunning(true);
    setHasRun(false);
    setTimeout(() => {
      const key = fileName.toLowerCase().includes('office') ? 'indoor' : fileName.toLowerCase().includes('out') ? 'outdoor' : 'default';
      setScenes(SCENE_PRESETS[key]);
      setHasRun(true);
      setRunning(false);
    }, 750);
  };

  const topScene = scenes[0];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-purple-600" />
          <h1 className="text-lg font-semibold text-gray-900">视觉概念定位</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          接口演示：输入图像，输出场景分类结果（视觉概念标签与置信度）。
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
                onClick={classify}
                disabled={running}
                className="text-sm px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-lg flex items-center gap-1.5"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                调用场景分类接口
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <Layers size={13} className="text-purple-500" /> 输出 · scene_concepts
            </div>
            <div className="p-4 flex-1 space-y-4">
              {!hasRun && !running && (
                <p className="text-sm text-gray-400 text-center py-12">场景分类结果将显示在此处</p>
              )}
              {running && (
                <p className="text-sm text-gray-400 text-center py-12 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> 分类中…
                </p>
              )}
              {hasRun && topScene && (
                <>
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-[4/3]">
                    <img src={imageUrl} alt="输出" className="w-full h-full object-cover opacity-90" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                      <div className="text-white text-sm font-semibold">{topScene.label}</div>
                      <div className="text-white/80 text-xs">主场景 · {(topScene.score * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {scenes.map((s, i) => (
                      <div key={s.label} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-4 tabular-nums">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-xs font-medium text-gray-800 truncate">{s.label}</span>
                            <span className="text-xs text-gray-500 tabular-nums">{(s.score * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${i === 0 ? 'bg-purple-500' : 'bg-purple-300'}`}
                              style={{ width: `${s.score * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
