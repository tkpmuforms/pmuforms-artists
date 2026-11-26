import { ShieldAlert } from "lucide-react";
import "./no-id-upload-note.scss";

/**
 * Shown wherever a photo of a client can be added. Our Terms forbid storing
 * IDs; the appointment's "ID check" record is what to use instead.
 */
const NoIdUploadNote: React.FC = () => (
  <p className="no-id-upload-note">
    <ShieldAlert size={14} aria-hidden />
    <span>
      Don't upload photos of IDs, driver's licenses, passports or bank cards.
      To show you checked a client's ID, use "Record ID check" on their
      appointment.
    </span>
  </p>
);

export default NoIdUploadNote;
