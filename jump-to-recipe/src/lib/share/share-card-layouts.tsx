/* eslint-disable @next/next/no-img-element -- these render to a PNG via next/og, not the DOM */

// Card layouts for recipe link previews (1200×630). Rendered by satori,
// so every element with more than one child needs display: flex.

const INK = '#1c1917';
const PAPER = '#ffffff';
const MUTED = '#57534e';
const WASH = '#f5f5f4';
const FONT = 'Geist, sans-serif';

function BrandRow({ mascot }: { mascot: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <img src={mascot} width={44} height={44} alt="" />
      <div style={{ fontSize: 28, fontWeight: 800, color: MUTED }}>Happeacook</div>
    </div>
  );
}

function PhotoArea({ photo, mascot }: { photo: string | null; mascot: string }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        style={{ width: '100%', height: 400, objectFit: 'cover' }}
      />
    );
  }
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: 400,
        alignItems: 'center',
        justifyContent: 'center',
        background: WASH,
      }}
    >
      <img src={mascot} width={300} height={300} alt="" />
    </div>
  );
}

export function RecipeShareCard({
  title,
  photo,
  mascot,
}: {
  title: string;
  photo: string | null;
  mascot: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: PAPER,
        fontFamily: FONT,
      }}
    >
      <PhotoArea photo={photo} mascot={mascot} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 64px',
          gap: 14,
        }}
      >
        <div
          style={{
            fontSize: title.length > 32 ? 48 : 64,
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: INK,
            textAlign: 'center',
            display: 'block',
            lineClamp: 2,
          }}
        >
          {title}
        </div>
        <BrandRow mascot={mascot} />
      </div>
    </div>
  );
}

export function GenericShareCard({ mascot }: { mascot: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        background: PAPER,
        fontFamily: FONT,
        gap: 24,
      }}
    >
      <img src={mascot} width={300} height={300} alt="" />
      <div style={{ fontSize: 80, fontWeight: 800, letterSpacing: '-0.03em', color: INK }}>
        Happeacook
      </div>
      <div style={{ fontSize: 32, color: MUTED }}>Family recipes, all in one place</div>
    </div>
  );
}
