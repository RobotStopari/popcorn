import {
  PAGE_BLOCK_ALIGNMENTS,
  PAGE_BLOCK_LABELS,
  PAGE_BLOCK_TYPES,
  PAGE_BLOCK_IMAGE_TRIPLET_GAP_DEFAULT,
  PAGE_BLOCK_IMAGE_TRIPLET_GAP_MAX,
  PAGE_BLOCK_IMAGE_TRIPLET_GAP_MIN,
  PAGE_BLOCK_IMAGE_TRIPLET_MAX_REM,
  PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_DEFAULT,
  PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_MAX,
  PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_MIN,
  PAGE_BLOCK_IMAGE_TEXT_SHARE_DEFAULT,
  PAGE_BLOCK_IMAGE_TEXT_SHARE_MAX,
  PAGE_BLOCK_IMAGE_TEXT_SHARE_MIN,
  PAGE_BLOCK_IMAGE_TEXT_GAP_DEFAULT,
  PAGE_BLOCK_IMAGE_TEXT_GAP_MAX,
  PAGE_BLOCK_IMAGE_TEXT_GAP_MIN,
  PAGE_BLOCK_REFERENCE_GAP_DEFAULT,
  PAGE_BLOCK_SPACE_HEIGHT_DEFAULT,
  PAGE_BLOCK_SPACE_HEIGHT_MAX,
  PAGE_BLOCK_SPACE_HEIGHT_MIN,
  PAGE_BLOCK_NEGATIVE_SPACE_PULL_DEFAULT,
  PAGE_BLOCK_NEGATIVE_SPACE_PULL_MAX,
  PAGE_BLOCK_NEGATIVE_SPACE_PULL_MIN,
  PAGE_BLOCK_WIDE_IMAGE_MAX_REM,
  PAGE_BLOCK_WIDE_IMAGE_WIDTH_DEFAULT,
  PAGE_BLOCK_WIDE_IMAGE_WIDTH_MAX,
  PAGE_BLOCK_WIDE_IMAGE_WIDTH_MIN,
} from '../data/page-blocks';
import AdminMedallionsEditor from './AdminMedallionsEditor';
import AdminPageBlockButtonFields from './AdminPageBlockButtonFields';
import AdminParallaxBandFields from './AdminParallaxBandFields';
import AdminSocialLinksEditor from './AdminSocialLinksEditor';
import PageBlockImageUpload from './PageBlockImageUpload';
import RichTextEditor from './RichTextEditor';

function BlockEditorSection({ title, hint, compact = false, children }) {
  return (
    <section className={`admin-page-block-section${compact ? ' admin-page-block-section--compact' : ''}`}>
      {(title || hint) && (
        <header className="admin-page-block-section__head">
          {title && <h3 className="admin-page-block-section__title">{title}</h3>}
          {hint && <p className="admin-page-block-section__hint">{hint}</p>}
        </header>
      )}
      <div className="admin-page-block-section__body">{children}</div>
    </section>
  );
}

function BlockEditorField({ label, htmlFor, hint, children }) {
  const Tag = htmlFor ? 'label' : 'div';
  return (
    <div className="admin-page-block-field">
      {label && (
        <Tag className="admin-page-block-field__label" htmlFor={htmlFor}>
          {label}
        </Tag>
      )}
      {hint && <p className="admin-page-block-field__hint">{hint}</p>}
      {children}
    </div>
  );
}

function BlockEditorRange({
  id,
  label,
  value,
  min,
  max,
  step,
  formatValue,
  scaleStart,
  scaleMiddle,
  scaleEnd,
  onChange,
  ariaLabel,
}) {
  return (
    <div className="admin-parallax-fields__height">
      <div className="admin-parallax-fields__height-top">
        <span className="admin-parallax-fields__height-label">{label}</span>
        <span className="admin-parallax-fields__height-value">{formatValue(value)}</span>
      </div>

      <input
        id={id}
        type="range"
        className="admin-parallax-fields__range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onInput={(event) => onChange(Number(event.target.value))}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={ariaLabel}
      />

      <div className="admin-parallax-fields__height-scale" aria-hidden="true">
        <span>{scaleStart}</span>
        {scaleMiddle && <span>{scaleMiddle}</span>}
        <span>{scaleEnd}</span>
      </div>
    </div>
  );
}

function BlockEditorLightboxToggle({ id, enabled, onChange }) {
  return (
    <label className="admin-toggle admin-page-block-button__toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={enabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="admin-toggle__track" aria-hidden="true">
        <span className="admin-toggle__thumb" />
      </span>
      <span className="admin-toggle__label">Povolit zvětšení po kliknutí</span>
    </label>
  );
}

function BlockEditorBorderToggle({ id, enabled, onChange }) {
  return (
    <label className="admin-toggle admin-page-block-button__toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={enabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="admin-toggle__track" aria-hidden="true">
        <span className="admin-toggle__thumb" />
      </span>
      <span className="admin-toggle__label">Zobrazit rámeček kolem obrázku</span>
    </label>
  );
}

function BlockEditorBoldToggle({ id, enabled, onChange }) {
  return (
    <label className="admin-toggle admin-page-block-button__toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={enabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="admin-toggle__track" aria-hidden="true">
        <span className="admin-toggle__thumb" />
      </span>
      <span className="admin-toggle__label">Tučný text</span>
    </label>
  );
}

function formatWidthPercentLabel(percent, maxRem) {
  const widthRem = Math.round((maxRem * percent) / 10) / 10;
  return `${percent} % · ${widthRem} rem`;
}

function AlignmentPicker({ value, onChange }) {
  const labels = { left: 'Vlevo', center: 'Na střed', right: 'Vpravo' };

  return (
    <BlockEditorField label="Zarovnání textu">
      <div className="admin-page-block-segment" role="group" aria-label="Zarovnání textu">
        {PAGE_BLOCK_ALIGNMENTS.map((align) => (
          <button
            key={align}
            type="button"
            className={`admin-page-block-segment__btn${value === align ? ' is-active' : ''}`}
            onClick={() => onChange(align)}
          >
            {labels[align]}
          </button>
        ))}
      </div>
    </BlockEditorField>
  );
}

function LayoutPicker({ reversed, onChange }) {
  return (
    <BlockEditorField label="Rozložení">
      <div className="admin-page-block-segment admin-page-block-segment--two" role="group" aria-label="Rozložení obrázku a textu">
        <button
          type="button"
          className={`admin-page-block-segment__btn${!reversed ? ' is-active' : ''}`}
          onClick={() => onChange(false)}
        >
          Obrázek vlevo
        </button>
        <button
          type="button"
          className={`admin-page-block-segment__btn${reversed ? ' is-active' : ''}`}
          onClick={() => onChange(true)}
        >
          Obrázek vpravo
        </button>
      </div>
    </BlockEditorField>
  );
}

export default function AdminPageBlockEditor({
  block,
  onChange,
}) {
  const update = (patch) => onChange(patch);

  if (block.type === PAGE_BLOCK_TYPES.paragraph) {
    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection title="Odstavec" hint="Textový blok v šířce obsahu stránky.">
          <AlignmentPicker value={block.align} onChange={(align) => update({ align })} />
          <RichTextEditor
            value={block.html}
            onChange={(html) => update({ html })}
            features="pageParagraph"
            label="Text odstavce"
          />
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.h1) {
    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection
          title="Nadpis H1"
          hint="Zobrazí se jako žlutý štítek uprostřed stránky."
        >
          <BlockEditorField label="Text nadpisu" htmlFor={`block-${block.id}-text`}>
            <input
              id={`block-${block.id}-text`}
              className="admin-form__input admin-page-block-field__input"
              value={block.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Název sekce…"
            />
          </BlockEditorField>
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.h2) {
    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection
          title="Nadpis H2"
          hint="Zobrazí se jako velký podnadpis v šířce obsahu."
        >
          <AlignmentPicker value={block.align} onChange={(align) => update({ align })} />
          <BlockEditorField label="Text nadpisu" htmlFor={`block-${block.id}-text`}>
            <input
              id={`block-${block.id}-text`}
              className="admin-form__input admin-page-block-field__input"
              value={block.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Podnadpis…"
            />
          </BlockEditorField>
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.citation) {
    const bold = block.bold !== false;

    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection
          title="Citace"
          hint="Velká úvodní citace s uvozovkami — typicky na začátku stránky."
        >
          <BlockEditorField label="Text citace" htmlFor={`block-${block.id}-text`}>
            <textarea
              id={`block-${block.id}-text`}
              className="admin-form__input admin-page-block-field__textarea"
              rows={5}
              value={block.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Napište citaci…"
            />
          </BlockEditorField>

          <BlockEditorBoldToggle
            id={`block-${block.id}-citation-bold`}
            enabled={bold}
            onChange={(value) => update({ bold: value })}
          />
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.imageText) {
    const lightboxEnabled = block.lightboxEnabled !== false;
    const borderEnabled = block.borderEnabled !== false;
    const imageSharePercent = block.imageSharePercent ?? PAGE_BLOCK_IMAGE_TEXT_SHARE_DEFAULT;
    const gapRem = block.gapRem ?? PAGE_BLOCK_IMAGE_TEXT_GAP_DEFAULT;

    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection title="Obrázek" hint="Nahrání přes Cloudinary preset galerie příspěvku.">
          <PageBlockImageUpload
            imageUrl={block.imageUrl}
            imagePublicId={block.imagePublicId}
            previewSeed={block.id}
            onChange={(image) => update(image)}
          />
          <BlockEditorField
            label="Popis obrázku (alt)"
            htmlFor={`block-${block.id}-alt`}
            hint="Krátký popis pro čtečky obrazovky a vyhledávače."
          >
            <input
              id={`block-${block.id}-alt`}
              className="admin-form__input admin-page-block-field__input"
              value={block.imageAlt}
              onChange={(e) => update({ imageAlt: e.target.value })}
              placeholder="Co je na obrázku…"
            />
          </BlockEditorField>

          <BlockEditorBorderToggle
            id={`block-${block.id}-image-text-border`}
            enabled={borderEnabled}
            onChange={(value) => update({ borderEnabled: value })}
          />

          <BlockEditorLightboxToggle
            id={`block-${block.id}-image-text-lightbox`}
            enabled={lightboxEnabled}
            onChange={(value) => update({ lightboxEnabled: value })}
          />
        </BlockEditorSection>

        <BlockEditorSection title="Text a rozložení">
          <LayoutPicker
            reversed={block.reversed}
            onChange={(reversed) => update({ reversed })}
          />
          <BlockEditorRange
            id={`block-${block.id}-image-text-share`}
            label="Poměr"
            value={imageSharePercent}
            min={PAGE_BLOCK_IMAGE_TEXT_SHARE_MIN}
            max={PAGE_BLOCK_IMAGE_TEXT_SHARE_MAX}
            step={1}
            formatValue={(value) => `${value} % obrázek · ${100 - value} % text`}
            scaleStart={`${PAGE_BLOCK_IMAGE_TEXT_SHARE_MIN} %`}
            scaleMiddle={`Výchozí ${PAGE_BLOCK_IMAGE_TEXT_SHARE_DEFAULT} %`}
            scaleEnd={`${PAGE_BLOCK_IMAGE_TEXT_SHARE_MAX} %`}
            onChange={(value) => update({ imageSharePercent: value })}
            ariaLabel="Poměr šířky obrázku a textu"
          />
          <BlockEditorRange
            id={`block-${block.id}-image-text-gap`}
            label="Mezera mezi obrázkem a textem"
            value={gapRem}
            min={PAGE_BLOCK_IMAGE_TEXT_GAP_MIN}
            max={PAGE_BLOCK_IMAGE_TEXT_GAP_MAX}
            step={0.25}
            formatValue={(value) => `${value} rem`}
            scaleStart={`${PAGE_BLOCK_IMAGE_TEXT_GAP_MIN} rem`}
            scaleMiddle={`Výchozí ${PAGE_BLOCK_IMAGE_TEXT_GAP_DEFAULT} rem`}
            scaleEnd={`${PAGE_BLOCK_IMAGE_TEXT_GAP_MAX} rem`}
            onChange={(value) => update({ gapRem: value })}
            ariaLabel="Mezera mezi obrázkem a textem v rem"
          />
          <AlignmentPicker value={block.align} onChange={(align) => update({ align })} />
          <RichTextEditor
            value={block.html}
            onChange={(html) => update({ html })}
            features="pageParagraph"
            label="Text vedle obrázku"
          />
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.socials) {
    return (
      <div className="admin-page-block-editor admin-page-block-editor--widget">
        <BlockEditorSection
          compact
          title="Pozadí a výška"
          hint="Široký parallax banner. Bez vlastního obrázku se zobrazí dekorativní textura."
        >
          <AdminParallaxBandFields
            block={block}
            onChange={(patch) => update(patch)}
          />
        </BlockEditorSection>

        <BlockEditorSection
          compact
          title="Sociální tlačítka"
          hint="Zapněte až 4 tlačítka. Odkazy (kromě Web) se berou z Nastavení webu."
        >
          <AdminSocialLinksEditor
            links={block.links}
            onChange={update}
          />
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.parallaxImage) {
    return (
      <div className="admin-page-block-editor admin-page-block-editor--widget">
        <BlockEditorSection
          compact
          title="Parallax obrázek"
          hint="Široký parallax řádek bez tlačítek. Bez obrázku se zobrazí dekorativní textura."
        >
          <AdminParallaxBandFields
            block={block}
            onChange={(patch) => update(patch)}
          />
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.wideImage) {
    const maxWidthPercent = block.maxWidthPercent ?? PAGE_BLOCK_WIDE_IMAGE_WIDTH_DEFAULT;
    const lightboxEnabled = block.lightboxEnabled !== false;
    const borderEnabled = block.borderEnabled !== false;

    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection
          title="Široký obrázek"
          hint="Velký vodorovný obrázek uprostřed stránky."
        >
          <PageBlockImageUpload
            variant="banner"
            imageUrl={block.imageUrl}
            imagePublicId={block.imagePublicId}
            previewSeed={block.id}
            onChange={(image) => update(image)}
          />
          <BlockEditorField
            label="Popis obrázku (alt)"
            htmlFor={`block-${block.id}-alt`}
          >
            <input
              id={`block-${block.id}-alt`}
              className="admin-form__input admin-page-block-field__input"
              value={block.imageAlt}
              onChange={(e) => update({ imageAlt: e.target.value })}
              placeholder="Co je na obrázku…"
            />
          </BlockEditorField>

          <BlockEditorRange
            id={`block-${block.id}-wide-width`}
            label="Šířka bloku"
            value={maxWidthPercent}
            min={PAGE_BLOCK_WIDE_IMAGE_WIDTH_MIN}
            max={PAGE_BLOCK_WIDE_IMAGE_WIDTH_MAX}
            step={1}
            formatValue={(value) => formatWidthPercentLabel(value, PAGE_BLOCK_WIDE_IMAGE_MAX_REM)}
            scaleStart={`${PAGE_BLOCK_WIDE_IMAGE_WIDTH_MIN} %`}
            scaleMiddle={`Výchozí ${PAGE_BLOCK_WIDE_IMAGE_WIDTH_DEFAULT} %`}
            scaleEnd={`${PAGE_BLOCK_WIDE_IMAGE_WIDTH_MAX} %`}
            onChange={(value) => update({ maxWidthPercent: value })}
            ariaLabel="Šířka širokého obrázku v procentech"
          />

          <BlockEditorBorderToggle
            id={`block-${block.id}-wide-border`}
            enabled={borderEnabled}
            onChange={(value) => update({ borderEnabled: value })}
          />

          <BlockEditorLightboxToggle
            id={`block-${block.id}-wide-lightbox`}
            enabled={lightboxEnabled}
            onChange={(value) => update({ lightboxEnabled: value })}
          />
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.imageTriplet) {
    const maxWidthPercent = block.maxWidthPercent ?? PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_DEFAULT;
    const gapRem = block.gapRem ?? PAGE_BLOCK_IMAGE_TRIPLET_GAP_DEFAULT;
    const lightboxEnabled = block.lightboxEnabled !== false;
    const borderEnabled = block.borderEnabled !== false;

    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection
          title="Tři obrázky"
          hint="Každý obrázek nahrajte zvlášť. Na webu se zobrazí v řadě tří čtverců."
        >
          <BlockEditorRange
            id={`block-${block.id}-triplet-width`}
            label="Šířka řady"
            value={maxWidthPercent}
            min={PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_MIN}
            max={PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_MAX}
            step={1}
            formatValue={(value) => formatWidthPercentLabel(value, PAGE_BLOCK_IMAGE_TRIPLET_MAX_REM)}
            scaleStart={`${PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_MIN} %`}
            scaleMiddle={`Výchozí ${PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_DEFAULT} %`}
            scaleEnd={`${PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_MAX} %`}
            onChange={(value) => update({ maxWidthPercent: value })}
            ariaLabel="Šířka řady tří obrázků v procentech"
          />

          <BlockEditorRange
            id={`block-${block.id}-triplet-gap`}
            label="Mezera mezi obrázky"
            value={gapRem}
            min={PAGE_BLOCK_IMAGE_TRIPLET_GAP_MIN}
            max={PAGE_BLOCK_IMAGE_TRIPLET_GAP_MAX}
            step={0.25}
            formatValue={(value) => `${value} rem`}
            scaleStart={`${PAGE_BLOCK_IMAGE_TRIPLET_GAP_MIN} rem`}
            scaleMiddle={`Výchozí ${PAGE_BLOCK_IMAGE_TRIPLET_GAP_DEFAULT} rem`}
            scaleEnd={`${PAGE_BLOCK_IMAGE_TRIPLET_GAP_MAX} rem`}
            onChange={(value) => update({ gapRem: value })}
            ariaLabel="Mezera mezi obrázky v rem"
          />

          <BlockEditorBorderToggle
            id={`block-${block.id}-triplet-border`}
            enabled={borderEnabled}
            onChange={(value) => update({ borderEnabled: value })}
          />

          <BlockEditorLightboxToggle
            id={`block-${block.id}-triplet-lightbox`}
            enabled={lightboxEnabled}
            onChange={(value) => update({ lightboxEnabled: value })}
          />

          {(block.images || []).map((image, index) => (
            <div key={index} className="admin-page-block-image-slot">
              <h4 className="admin-page-block-image-slot__title">{`Obrázek ${index + 1}`}</h4>
              <PageBlockImageUpload
                variant="square"
                stacked
                imageUrl={image.imageUrl}
                imagePublicId={image.imagePublicId}
                previewSeed={`${block.id}-${index}`}
                onChange={(patch) => {
                  const images = [...(block.images || [])];
                  images[index] = { ...images[index], ...patch };
                  update({ images });
                }}
              />
              <BlockEditorField
                label="Popis obrázku (alt)"
                htmlFor={`block-${block.id}-alt-${index}`}
              >
                <input
                  id={`block-${block.id}-alt-${index}`}
                  className="admin-form__input admin-page-block-field__input"
                  value={image.imageAlt || ''}
                  onChange={(event) => {
                    const images = [...(block.images || [])];
                    images[index] = { ...images[index], imageAlt: event.target.value };
                    update({ images });
                  }}
                  placeholder="Co je na obrázku…"
                />
              </BlockEditorField>
            </div>
          ))}
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.button) {
    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection
          title="Tlačítko"
          hint="Jedno velké tlačítko uprostřed stránky."
        >
          <AdminPageBlockButtonFields
            prefix={`block-${block.id}`}
            button={block}
            onChange={(button) => update(button)}
          />
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.buttonPair) {
    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection
          title="Dvě tlačítka"
          hint="Dvě tlačítka vedle sebe uprostřed stránky."
        >
          {(block.buttons || []).map((button, index) => (
            <BlockEditorSection
              key={index}
              compact
              title={`Tlačítko ${index + 1}`}
            >
              <AdminPageBlockButtonFields
                prefix={`block-${block.id}-${index}`}
                button={button}
                onChange={(nextButton) => {
                  const buttons = [...(block.buttons || [])];
                  buttons[index] = nextButton;
                  update({ buttons });
                }}
              />
            </BlockEditorSection>
          ))}
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.youtube) {
    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection
          title="YouTube video"
          hint="Stejný vzhled jako video vložené do blogového příspěvku."
        >
          <BlockEditorField
            label="Odkaz na video"
            htmlFor={`block-${block.id}-youtube-url`}
            hint="Podporované formáty: youtube.com/watch, youtu.be, /shorts/…"
          >
            <input
              id={`block-${block.id}-youtube-url`}
              className="admin-form__input admin-page-block-field__input"
              type="url"
              value={block.videoUrl || ''}
              onChange={(event) => update({ videoUrl: event.target.value })}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </BlockEditorField>
          <BlockEditorField
            label="Název videa"
            htmlFor={`block-${block.id}-youtube-title`}
          >
            <input
              id={`block-${block.id}-youtube-title`}
              className="admin-form__input admin-page-block-field__input"
              value={block.title || ''}
              onChange={(event) => update({ title: event.target.value })}
              placeholder="Např. Jak jsme natočili reportáž"
            />
          </BlockEditorField>
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.space) {
    const heightRem = block.heightRem ?? PAGE_BLOCK_SPACE_HEIGHT_DEFAULT;

    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection
          title="Mezera"
          hint="Prázdný bílý prostor pro vizuální oddělení sekcí."
        >
          <div className="admin-parallax-fields__height">
            <div className="admin-parallax-fields__height-top">
              <span className="admin-parallax-fields__height-label">Výška mezery</span>
              <span className="admin-parallax-fields__height-value">{heightRem} rem</span>
            </div>

            <input
              id={`block-${block.id}-space-height`}
              type="range"
              className="admin-parallax-fields__range"
              min={PAGE_BLOCK_SPACE_HEIGHT_MIN}
              max={PAGE_BLOCK_SPACE_HEIGHT_MAX}
              step={0.5}
              value={heightRem}
              onChange={(event) => update({ heightRem: Number(event.target.value) })}
              aria-valuemin={PAGE_BLOCK_SPACE_HEIGHT_MIN}
              aria-valuemax={PAGE_BLOCK_SPACE_HEIGHT_MAX}
              aria-valuenow={heightRem}
              aria-label="Výška mezery v rem"
            />

            <div className="admin-parallax-fields__height-scale" aria-hidden="true">
              <span>{PAGE_BLOCK_SPACE_HEIGHT_MIN} rem</span>
              <span>Výchozí {PAGE_BLOCK_SPACE_HEIGHT_DEFAULT} rem</span>
              <span>{PAGE_BLOCK_SPACE_HEIGHT_MAX} rem</span>
            </div>
          </div>
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.negativeSpace) {
    const pullRem = block.pullRem ?? PAGE_BLOCK_NEGATIVE_SPACE_PULL_DEFAULT;

    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection
          title="Záporná mezera"
          hint="Zmenší vzdálenost mezi prvkem nad a pod touto mezerou. Vložte mezi dva bloky."
        >
          <div className="admin-parallax-fields__height">
            <div className="admin-parallax-fields__height-top">
              <span className="admin-parallax-fields__height-label">Zmenšení mezery</span>
              <span className="admin-parallax-fields__height-value">−{pullRem} rem</span>
            </div>

            <input
              id={`block-${block.id}-negative-space-pull`}
              type="range"
              className="admin-parallax-fields__range"
              min={PAGE_BLOCK_NEGATIVE_SPACE_PULL_MIN}
              max={PAGE_BLOCK_NEGATIVE_SPACE_PULL_MAX}
              step={0.5}
              value={pullRem}
              onChange={(event) => update({ pullRem: Number(event.target.value) })}
              aria-valuemin={PAGE_BLOCK_NEGATIVE_SPACE_PULL_MIN}
              aria-valuemax={PAGE_BLOCK_NEGATIVE_SPACE_PULL_MAX}
              aria-valuenow={pullRem}
              aria-label="Zmenšení mezery v rem"
            />

            <div className="admin-parallax-fields__height-scale" aria-hidden="true">
              <span>{PAGE_BLOCK_NEGATIVE_SPACE_PULL_MIN} rem</span>
              <span>Výchozí {PAGE_BLOCK_NEGATIVE_SPACE_PULL_DEFAULT} rem</span>
              <span>{PAGE_BLOCK_NEGATIVE_SPACE_PULL_MAX} rem</span>
            </div>
          </div>
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.citationSmall) {
    const bold = block.bold !== false;

    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection
          title="Malá citace"
          hint="Menší citace se uvozovkami v šířce odstavce."
        >
          <BlockEditorField label="Text citace" htmlFor={`block-${block.id}-text`}>
            <textarea
              id={`block-${block.id}-text`}
              className="admin-form__input admin-page-block-field__textarea"
              rows={4}
              value={block.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Napište citaci…"
            />
          </BlockEditorField>

          <BlockEditorBoldToggle
            id={`block-${block.id}-citation-small-bold`}
            enabled={bold}
            onChange={(value) => update({ bold: value })}
          />
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.reference) {
    const borderEnabled = block.borderEnabled !== false;
    const gapRem = block.gapRem ?? PAGE_BLOCK_REFERENCE_GAP_DEFAULT;
    const bold = block.bold !== false;

    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection title="Fotka" hint="Kulatý portrét osoby — nahrání přes Cloudinary.">
          <PageBlockImageUpload
            imageUrl={block.imageUrl}
            imagePublicId={block.imagePublicId}
            previewSeed={block.id}
            onChange={(image) => update(image)}
          />
          <BlockEditorField
            label="Jméno"
            htmlFor={`block-${block.id}-name`}
            hint="Zobrazí se pod fotkou a použije jako popis obrázku pro čtečky obrazovky."
          >
            <input
              id={`block-${block.id}-name`}
              className="admin-form__input admin-page-block-field__input"
              value={block.name || block.imageAlt || ''}
              onChange={(e) => {
                const value = e.target.value;
                update({ name: value, imageAlt: value });
              }}
              placeholder="Jméno osoby…"
            />
          </BlockEditorField>

          <BlockEditorBorderToggle
            id={`block-${block.id}-reference-border`}
            enabled={borderEnabled}
            onChange={(value) => update({ borderEnabled: value })}
          />
        </BlockEditorSection>

        <BlockEditorSection title="Citace a rozložení">
          <LayoutPicker
            reversed={block.reversed}
            onChange={(reversed) => update({ reversed })}
          />
          <BlockEditorRange
            id={`block-${block.id}-reference-gap`}
            label="Mezera mezi fotkou a citací"
            value={gapRem}
            min={PAGE_BLOCK_IMAGE_TEXT_GAP_MIN}
            max={PAGE_BLOCK_IMAGE_TEXT_GAP_MAX}
            step={0.25}
            formatValue={(value) => `${value} rem`}
            scaleStart={`${PAGE_BLOCK_IMAGE_TEXT_GAP_MIN} rem`}
            scaleMiddle={`Výchozí ${PAGE_BLOCK_REFERENCE_GAP_DEFAULT} rem`}
            scaleEnd={`${PAGE_BLOCK_IMAGE_TEXT_GAP_MAX} rem`}
            onChange={(value) => update({ gapRem: value })}
            ariaLabel="Mezera mezi fotkou a citací v rem"
          />
          <BlockEditorField label="Text citace" htmlFor={`block-${block.id}-text`}>
            <textarea
              id={`block-${block.id}-text`}
              className="admin-form__input admin-page-block-field__textarea"
              rows={4}
              value={block.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Co tato osoba řekla…"
            />
          </BlockEditorField>
          <AlignmentPicker value={block.align} onChange={(align) => update({ align })} />
          <BlockEditorBoldToggle
            id={`block-${block.id}-reference-bold`}
            enabled={bold}
            onChange={(value) => update({ bold: value })}
          />
        </BlockEditorSection>
      </div>
    );
  }

  if (block.type === PAGE_BLOCK_TYPES.medallions) {
    return (
      <div className="admin-page-block-editor">
        <BlockEditorSection
          title="Medailonky"
          hint="Profilové karty lidí. Každá osoba má fotku, kontakty a krátký popis."
        >
          <AdminMedallionsEditor
            people={block.people}
            onChange={update}
          />
        </BlockEditorSection>
      </div>
    );
  }

  return null;
}

export function getBlockEditorTitle(block) {
  return PAGE_BLOCK_LABELS[block?.type] || 'Upravit prvek';
}
