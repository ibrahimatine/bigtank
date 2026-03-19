import qrcode from 'qrcode-generator';

interface QrCodeProps {
  url: string;
  size?: number;
}

export function QrCode({ url, size = 160 }: QrCodeProps) {
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const cellSize = size / moduleCount;

  const cells: { x: number; y: number }[] = [];
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        cells.push({ x: col * cellSize, y: row * cellSize });
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`QR code vers ${url}`}
    >
      <rect width={size} height={size} fill="white" />
      {cells.map((cell, i) => (
        <rect
          key={i}
          x={cell.x}
          y={cell.y}
          width={cellSize}
          height={cellSize}
          fill="#1a1a1a"
          rx={cellSize * 0.15}
        />
      ))}
    </svg>
  );
}
