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

export default function Studio() {
  const [fg, setFg] = useState("#bd93f9");
  const [bg, setBg] = useState("#282a36");
  const [clear, setClear] = useState(false);
  const [dots, setDots] = useState<DotType>("extra-rounded");
  const [frame, setFrame] = useState<CornerSquareType>("extra-rounded");
  const [ball, setBall] = useState<CornerDotType>("dot");
  const [ecc, setEcc] = useState<(typeof ECC)[number]>("Q");
  const [size, setSize] = useState(360);
  const [margin, setMargin] = useState(24);
  const [logo, setLogo] = useState<string | undefined>();
  const [logoScale, setLogoScale] = useState(0.4);
  const [copied, setCopied] = useState(false);

  // live-refresh with a short settle so typing feels instant but never races
  const [dataInput, setDataInput] = useState("https://tsc.hk");
  const [liveData, setLiveData] = useState(dataInput);
  useEffect(() => {
    const t = setTimeout(() => setLiveData(dataInput), 120);
    return () => clearTimeout(t);
  }, [dataInput]);

  const canvasHost = useRef<HTMLDivElement>(null);
  const svgHost = useRef<HTMLDivElement>(null);
  const display = useRef<QRCodeStyling | null>(null);
  const exporter = useRef<QRCodeStyling | null>(null);

  const options: Options = useMemo(
    () => ({
      width: size,
      height: size,
      data: liveData,
      margin,
      qrOptions: { errorCorrectionLevel: ecc },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: logoScale,
        crossOrigin: "anonymous",
      },
      dotsOptions: { color: fg, type: dots },
      cornersSquareOptions: { color: fg, type: frame },
      cornersDotOptions: { color: fg, type: ball },
      backgroundOptions: { color: clear ? "#00000000" : bg },
    }),
    [liveData, fg, bg, clear, dots, frame, ball, ecc, size, margin],
  );

  if (!display.current)
    display.current = new QRCodeStyling({ ...options, type: "canvas" });
  if (!exporter.current)
    exporter.current = new QRCodeStyling({ ...options, type: "svg" });

  useEffect(() => {
    display.current!.append(canvasHost.current!);
    exporter.current!.append(svgHost.current!);
  }, []);

  // every state change flows through here — the single source of truth
  useEffect(() => {
    const withImage: Options = {
      ...options,
      image: logo,
      imageOptions: { ...options.imageOptions, imageSize: logoScale },
    };
    void display.current!.update(withImage);
    void exporter.current!.update({ ...withImage, type: "svg" });
  }, [options, logo, logoScale]);

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

  function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return setLogo(undefined);
    const r = new FileReader();
    r.onload = () => setLogo(String(r.result));
    r.readAsDataURL(f);
  }

  return (
    <main className="min-h-dvh flex flex-col items-center px-6 py-14">
      <div className="w-full max-w-[420px] flex flex-col gap-10">
        {/* header */}
        <header className="flex items-center justify-between">
          <h1 className="text-xs tracking-[0.35em] uppercase text-fg/90">
            qr<span className="text-pink">·</span>forge
          </h1>
          <button
            onClick={shuffle}
            className="text-xs text-comment hover:text-fg transition-colors tracking-widest"
          >
            shuffle ⇄
          </button>
        </header>

        {/* preview */}
        <div className="flex justify-center">
          <div ref={canvasHost} className="checker rounded-[32px] p-6 shadow-2xl shadow-black/40" />
        </div>

        {/* payload */}
        <section className="flex flex-col gap-3">
          <Label>content</Label>
          <input
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
            spellCheck={false}
            placeholder="type or paste anything…"
            className="bg-panel/60 border border-panel rounded-2xl px-5 py-3.5 text-sm text-fg placeholder:text-comment/60 outline-none focus:border-purple focus:bg-panel transition-colors w-full"
          />
          {liveData !== dataInput && (
            <span className="text-[10px] text-purple tracking-widest">updating…</span>
          )}
        </section>

        {/* appearance */}
        <section className="flex flex-col gap-5">
          <Label>appearance</Label>

          <Swatches
            onPick={(f, b) => {
              setFg(f);
              setBg(b);
              setClear(false);
            }}
          />

          <Row label="pattern">
            <Segmented value={dots} onChange={(v) => setDots(v as DotType)} options={DOTS} />
          </Row>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Sub>frame</Sub>
              <Segmented value={frame} onChange={(v) => setFrame(v as CornerSquareType)} options={FRAMES} />
            </div>
            <div className="flex flex-col gap-2">
              <Sub>ball</Sub>
              <Segmented value={ball} onChange={(v) => setBall(v as CornerDotType)} options={BALLS} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Sub>ink &amp; paper</Sub>
            <div className="flex items-center gap-3">
              <ColorDot value={fg} onChange={setFg} title="ink" />
              <ColorDot value={bg} onChange={setBg} title="paper" dim={clear} />
              <Toggle on={clear} onChange={setClear}>clear</Toggle>
            </div>
          </div>
        </section>

        {/* tuning */}
        <section className="flex flex-col gap-5">
          <Label>tuning</Label>
          <Slider label="size" value={size} min={128} max={1024} step={16} onChange={setSize} />
          <Slider label="quiet zone" value={margin} min={0} max={64} step={4} onChange={setMargin} />
          <Row label="ecc">
            <Segmented value={ecc} onChange={(v) => setEcc(v as (typeof ECC)[number])} options={ECC} />
          </Row>
        </section>

        {/* logo */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>logo</Label>
            {logo && (
              <button onClick={() => setLogo(undefined)} className="text-[10px] text-red hover:underline">
                remove
              </button>
            )}
          </div>
          <label className="border border-dashed border-panel rounded-2xl px-5 py-4 text-center text-xs text-comment hover:text-fg hover:border-purple cursor-pointer transition-colors">
            {logo ? "replace image…" : "drop in an image…"}
            <input type="file" accept="image/*" onChange={upload} className="hidden" />
          </label>
          {logo && (
            <Slider label="logo size" value={Math.round(logoScale * 100)} min={15} max={60} step={5}
              onChange={(v) => setLogoScale(v / 100)} suffix="%" />
          )}
        </section>

        {/* export */}
        <section className="flex flex-col gap-4 pb-8">
          <div className="grid grid-cols-3 gap-3">
            <Primary onClick={() => save("png")}>PNG</Primary>
            <Secondary onClick={() => save("svg")}>SVG</Secondary>
            <Secondary onClick={() => save("jpeg")}>JPEG</Secondary>
          </div>
          <Ghost onClick={copyPng}>{copied ? "copied ✓" : "copy to clipboard"}</Ghost>
        </section>

        <footer className="pb-4 text-center text-[10px] tracking-[0.3em] uppercase text-comment/70">
          moonshine · dracula
        </footer>
      </div>

      <div ref={svgHost} className="hidden" />
    </main>
  );
}

/* ---------- pieces ---------- */

function Label({ children }: { children?: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-[0.25em] text-comment select-none">
      {children}
    </span>
  );
}

function Sub({ children }: { children?: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-[0.18em] text-comment/80 select-none">
      {children}
    </span>
  );
}

function Row(props: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Sub>{props.label}</Sub>
      {props.children}
    </div>
  );
}

function Segmented(props: { value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div className="flex bg-panel/50 border border-panel rounded-xl p-1 gap-1 flex-wrap">
      {props.options.map((o) => (
        <button
          key={o}
          onClick={() => props.onChange(o)}
          className={`flex-1 min-w-fit px-2 py-1.5 rounded-lg text-[11px] tracking-wide transition-all ${
            props.value === o
              ? "bg-fg text-base font-semibold"
              : "text-comment hover:text-fg"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Swatches(props: { onPick: (fg: string, bg: string) => void }) {
  return (
    <div className="grid grid-cols-10 gap-2">
      {PALETTES.map(([f, b]) => (
        <button
          key={f + b}
          title={`${f} on ${b}`}
          onClick={() => props.onPick(f, b)}
          className="aspect-square rounded-full border border-panel overflow-hidden transition-transform active:scale-90 hover:scale-110"
        >
          <span className="block w-full h-full" style={{ backgroundColor: b }}>
            <span className="block w-1/2 h-1/2 m-auto" style={{ backgroundColor: f }} />
          </span>
        </button>
      ))}
    </div>
  );
}

function ColorDot(props: { value: string; onChange: (v: string) => void; title: string; dim?: boolean }) {
  return (
    <label
      title={props.title}
      className={`relative w-7 h-7 rounded-full overflow-hidden border border-panel cursor-pointer transition-transform active:scale-90 ${
        props.dim ? "opacity-30 pointer-events-none" : ""
      }`}
      style={{ backgroundColor: props.value }}
    >
      <input
        type="color"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer scale-[2]"
      />
    </label>
  );
}

function Toggle(props: { on: boolean; onChange: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <button
      onClick={() => props.onChange(!props.on)}
      className={`text-[11px] tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
        props.on
          ? "bg-purple text-base border-purple font-semibold"
          : "text-comment border-panel hover:text-fg"
      }`}
    >
      {props.children}
    </button>
  );
}

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Sub>{props.label}</Sub>
        <span className="text-[11px] text-fg tabular-nums">
          {props.value}
          {props.suffix ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="mt-1.5 w-full h-1.5 appearance-none bg-panel rounded-full outline-none
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fg
          [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab"
      />
    </div>
  );
}

function Primary(props: { onClick: () => void; children?: React.ReactNode }) {
  return (
    <button
      onClick={props.onClick}
      className="py-3 rounded-2xl bg-fg text-base text-sm font-semibold tracking-wider hover:brightness-90 active:scale-[0.97] transition-all"
    >
      {props.children}
    </button>
  );
}

function Secondary(props: { onClick: () => void; children?: React.ReactNode }) {
  return (
    <button
      onClick={props.onClick}
      className="py-3 rounded-2xl bg-panel/50 border border-panel text-fg text-sm tracking-wider hover:border-fg/40 active:scale-[0.97] transition-all"
    >
      {props.children}
    </button>
  );
}

function Ghost(props: { onClick: () => void; children?: React.ReactNode }) {
  return (
    <button
      onClick={props.onClick}
      className="py-2.5 text-xs tracking-widest text-comment hover:text-fg active:scale-[0.98] transition-all"
    >
      {props.children}
    </button>
  );
}
