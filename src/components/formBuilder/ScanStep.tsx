import { ArrowDown, ArrowUp, Camera, ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type ScanResult,
  apiMessage,
  getScanStatus,
  scanPaperForm,
} from "../../services/formBuilderServices";
import { compressImage } from "../../utils/compressImage";

interface Page {
  id: string;
  file: File;
  preview: string;
}

interface ScanStepProps {
  onScanned: (result: ScanResult) => void;
  onBuildInstead: () => void;
}

let nextId = 0;

/** Photos of each page of a paper form, read into a draft form. */
const ScanStep: React.FC<ScanStepProps> = ({ onScanned, onBuildInstead }) => {
  const [status, setStatus] = useState<{ enabled: boolean; maxPages: number } | null>(
    null,
  );
  const [pages, setPages] = useState<Page[]>([]);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const pagesRef = useRef<Page[]>([]);
  pagesRef.current = pages;

  useEffect(() => {
    getScanStatus()
      .then(({ data }) => setStatus(data))
      // let them try; the scan itself says if it isn't available
      .catch(() => setStatus({ enabled: true, maxPages: 6 }));
  }, []);

  // free the previews when leaving
  useEffect(
    () => () => pagesRef.current.forEach((p) => URL.revokeObjectURL(p.preview)),
    [],
  );

  const maxPages = status?.maxPages ?? 6;

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setError("");
    const room = maxPages - pages.length;
    const files = Array.from(list).filter((f) => f.type.startsWith("image/") || !f.type);
    if (files.length > room) {
      setError(`You can scan up to ${maxPages} pages at a time.`);
    }
    setPages((prev) => [
      ...prev,
      ...files.slice(0, Math.max(0, room)).map((file) => ({
        id: `p${++nextId}`,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  };

  const removePage = (index: number) => {
    setPages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const movePage = (index: number, to: number) => {
    setPages((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [page] = next.splice(index, 1);
      next.splice(to, 0, page);
      return next;
    });
  };

  const read = async () => {
    setReading(true);
    setError("");
    try {
      const blobs: Blob[] = [];
      for (const [index, page] of pages.entries()) {
        try {
          blobs.push(await compressImage(page.file));
        } catch (err) {
          throw new Error(
            `Page ${index + 1}: ${(err as Error).message || "this photo can't be opened"}`,
          );
        }
      }
      const { data } = await scanPaperForm(blobs);
      onScanned(data);
    } catch (err) {
      setError(
        err instanceof Error && !("response" in err)
          ? err.message
          : apiMessage(err, "We couldn't read the photos. Please try again."),
      );
    } finally {
      setReading(false);
    }
  };

  if (status && !status.enabled) {
    return (
      <div className="form-builder__card scan-step">
        <h2>Scanning isn't available right now</h2>
        <p>You can still build the form yourself. It only takes a few minutes.</p>
        <button type="button" className="form-builder__primary" onClick={onBuildInstead}>
          Build it from scratch
        </button>
      </div>
    );
  }

  return (
    <div className="form-builder__card scan-step">
      <h2>Scan your paper form</h2>
      <p className="scan-step__lead">
        Take a photo of each page. We'll turn it into a digital form you can check
        and edit before saving.
      </p>
      <ul className="scan-step__tips">
        <li>Use a blank copy, not one a client filled in.</li>
        <li>Lay the page flat in good light and fill the frame with it.</li>
        <li>One photo per page, in order. Up to {maxPages} pages.</li>
      </ul>

      <div className="scan-step__buttons">
        <label className="scan-step__pick">
          <Camera size={18} /> Take a photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
            disabled={reading || pages.length >= maxPages}
          />
        </label>
        <label className="scan-step__pick">
          <ImagePlus size={18} /> Choose photos
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            aria-label="Choose photos"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
            disabled={reading || pages.length >= maxPages}
          />
        </label>
      </div>

      {pages.length > 0 && (
        <ol className="scan-step__pages" aria-label="Pages">
          {pages.map((page, index) => (
            <li key={page.id} className="scan-step__page">
              <img src={page.preview} alt={`Page ${index + 1}`} />
              <span>Page {index + 1}</span>
              <div className="form-builder__tools">
                <button
                  type="button"
                  aria-label={`Move page ${index + 1} up`}
                  disabled={reading || index === 0}
                  onClick={() => movePage(index, index - 1)}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  aria-label={`Move page ${index + 1} down`}
                  disabled={reading || index === pages.length - 1}
                  onClick={() => movePage(index, index + 1)}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  aria-label={`Remove page ${index + 1}`}
                  disabled={reading}
                  onClick={() => removePage(index)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {error && (
        <p className="form-builder__error" role="alert">
          {error}
        </p>
      )}

      <p className="scan-step__status" aria-live="polite">
        {reading ? "Reading your form… this usually takes 20 to 60 seconds." : ""}
      </p>

      <div className="form-builder__footer-buttons">
        <button
          type="button"
          className="form-builder__secondary"
          onClick={onBuildInstead}
          disabled={reading}
        >
          Build from scratch instead
        </button>
        <button
          type="button"
          className="form-builder__primary"
          onClick={read}
          disabled={reading || pages.length === 0}
        >
          {reading ? "Reading…" : "Read my form"}
        </button>
      </div>

      <p className="form-builder__small scan-step__privacy">
        Uses AI to read the text. We don't save your photos; they're sent to
        OpenAI only to read the form.
      </p>
    </div>
  );
};

export default ScanStep;
