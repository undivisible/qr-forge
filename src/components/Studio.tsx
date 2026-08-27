import { useEffect, useMemo, useRef, useState } from "react";
import QRCodeStyling, {
  type DotType,
  type CornerSquareType,
  type CornerDotType,
  type Options,
  type FileExtension,
} from "qr-code-styling";

const DOTS: DotType[] = [
  "square",
  "dots",
  "rounded",
  "classy",
  "classy-rounded",
  "extra-rounded",
];
const FRAMES: CornerSquareType[] = ["square", "dot", "extra-rounded"];
const BALLS: CornerDotType[] = ["square", "dot"];
const ECC = ["L", "M", "Q", "H"] as const;

// gmk dracula caps + mods
const PALETTES: Array<[string, string]> = [
  ["#282a36", "#f8f8f2"],
  ["#bd93f9", "#282a36"],
  ["#ff79c6", "#282a36"],
  ["#50fa7b", "#282a36"],
  ["#8be9fd", "#282a36"],
  ["#ffb86c", "#282a36"],
  ["#f8f8f2", "#bd93f9"],
  ["#f8f8f2", "#ff79c6"],
  ["#f1fa8c", "#44475a"],
  ["#ff5555", "#282a36"],
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

const lbl =
  "text-[10px] uppercase tracking-[0.18em] text-comment select-none";
const sel =
  "w-full bg-transparent border border-panel rounded-md px-2 py-1.5 text-xs text-fg outline-none focus:border-purple transition-colors";
const btn =
  "border border-panel rounded-md px-3 py-1.5 text-xs text-fg hover:border-purple hover:text-purple active:scale-95 transition cursor-pointer";

export default function Studio() {
  const [data, setData] = useState("https://tsc.hk");
  const [fg, setFg] = useState("#bd93f9");
  const [bg, setBg] = useState("#282a36");
  const [clear, setClear] = useState(false);
  const [dots, setDots] = useState<DotType>("extra-rounded");
  const [frame, setFrame] = useState<CornerSquareType>("extra-rounded");
  const [ball, setBall] = useState<CornerDotType>("dot");
  const [ecc, setEcc] = useState<(typeof ECC)[number]>("Q");
  const [size, setSize] = useState(320);
  const [margin, setMargin] = useState(24);
  const [logo, setLogo] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);

  const canvasHost = useRef<HTMLDivElement>(null);
  const svgHost = useRef<HTMLDivElement>(null);
  const display = useRef<QRCodeStyling | null>(null);
  const exporter = useRef<QRCodeStyling | null>(null);

  const options: Options = useMemo(
    () => ({
      width: size,
      height: size,
      data,
      margin,
      qrOptions: { errorCorrectionLevel: ecc },
      imageOptions: { hideBackgroundDots: true, imageSize: 0.4, crossOrigin: "anonymous" },
      dotsOptions: { color: fg, type: dots },
      cornersSquareOptions: { color: fg, type: frame },
      cornersDotOptions: { color: fg, type: ball },
      backgroundOptions: { color: clear ? "#00000000" : bg },
    }),
    [data, fg, bg, clear, dots, frame, ball, ecc, size, margin],
  );

  if (!display.current) display.current = new QRCodeStyling({ ...options, type: "canvas" });
  if (!exporter.current) exporter.current = new QRCodeStyling({ ...options, type: "svg" });

  useEffect(() => {
    display.current!.append(canvasHost.current!);
    exporter.current!.append(svgHost.current!);
  }, []);

  useEffect(() => {
    display.current!.update(options);
    exporter.current!.update({ ...options, type: "svg", image: logo });
  }, [options, logo]);

  function shuffle() {
    const [f, b] = pick(PALETTES);
    setFg(f);
    setBg(b);
    setClear(false);
    setDots(pick(DOTS));
    setFrame(pick(FRAMES));
    setBall(pick(BALLS));
  }

  async function save(ext: FileExtension) {
    const raw = await exporter.current!.getRawData(ext);
    if (!raw) return;
    const blob = raw instanceof Blob ? raw : new Blob([raw as unknown as BlobPart]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qr-forge.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function copyPng() {
    try {
      const raw = await display.current!.getRawData("png");
      if (!(raw instanceof Blob)) return;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": raw })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {}
  }

  return (
    <main className="min-h-dvh flex flex-col items-center gap-6 py-12 px-6">
      <header className="w-full max-w-3xl flex items-baseline justify-between">
        <h1 className="text-sm tracking-[0.25em] uppercase">
          qr<span className="text-pink">·</span>forge
        </h1>
        <button onClick={shuffle} className={btn}>
          shuffle ⇄
        </button>
      </header>

      <div ref={canvasHost} className="checker rounded-lg p-5" />

      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <div className="sm:col-span-2">
          <label className={lbl}>payload</label>
          <input
            value={data}
            onChange={(e) => setData(e.target.value)}
            spellCheck={false}
            className={`mt-1 ${sel}`}
          />
        </div>

        <Field label="dots">
          <select value={dots} onChange={(e) => setDots(e.target.value as DotType)} className={sel}>
            {DOTS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>

        <Field label="frame">
          <select value={frame} onChange={(e) => setFrame(e.target.value as CornerSquareType)} className={sel}>
            {FRAMES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>

        <Field label="ball">
          <select value={ball} onChange={(e) => setBall(e.target.value as CornerDotType)} className={sel}>
            {BALLS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>

        <Field label="ecc">
          <select value={ecc} onChange={(e) => setEcc(e.target.value as (typeof ECC)[number])} className={sel}>
            {ECC.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>

        <Field label="ink">
          <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} />
        </Field>

        <Field label="paper">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={bg}
              disabled={clear}
              onChange={(e) => setBg(e.target.value)}
              className={clear ? "opacity-30 pointer-events-none" : ""}
            />
            <Check checked={clear} onChange={setClear}>transparent</Check>
          </div>
        </Field>

        <Field label={`size · ${size}`}>
          <input type="range" min={128} max={1024} step={16} value={size}
            onChange={(e) => setSize(+e.target.value)} className="mt-2 w-full" />
        </Field>

        <Field label={`quiet · ${margin}`}>
          <input type="range" min={0} max={64} value={margin}
            onChange={(e) => setMargin(+e.target.value)} className="mt-2 w-full" />
        </Field>

        <div className="sm:col-span-2">
          <label className={lbl}>logo</label>
          <input type="file" accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return setLogo(undefined);
              const r = new FileReader();
              r.onload = () => setLogo(String(r.result));
              r.readAsDataURL(f);
            }}
            className="block mt-1 text-xs text-comment cursor-pointer" />
        </div>

        <div className="sm:col-span-2 mt-2 flex gap-2">
          <button onClick={() => save("png")} className={`${btn} border-green`}>png</button>
          <button onClick={() => save("svg")} className={`${btn} border-cyan`}>svg</button>
          <button onClick={() => save("jpeg")} className={`${btn} border-orange`}>jpg</button>
          <button onClick={copyPng} className={`${btn} ml-auto`}>
            {copied ? <span className="text-green">copied ✓</span> : "copy"}
          </button>
        </div>
      </div>

      <footer className="text-[10px] text-comment tracking-widest">
        moonshine · dracula
      </footer>
      <div ref={svgHost} className="hidden" />
    </main>
  );
}

function Field(props: { label: string; children?: React.ReactNode }) {
  return (
    <div>
      <span className={lbl}>{props.label}</span>
      <div className="mt-1">{props.children}</div>
    </div>
  );
}

function Check(props: { checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-comment cursor-pointer">
      <input type="checkbox" checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)} />
      {props.children}
    </label>
  );
}
