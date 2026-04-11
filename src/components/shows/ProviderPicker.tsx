import { getLogoUrl } from "../../utils/images";
import styles from "./ProviderPicker.module.css";

interface Provider {
  name: string;
  logo_path: string;
}

const PROVIDERS: Provider[] = [
  { name: "Amazon Prime Video", logo_path: "/pvske1MyAoymrs5bguRfVqYiM9a.jpg" },
  { name: "Apple TV", logo_path: "/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg" },
  { name: "Disney Plus", logo_path: "/97yvRBw1GzX7fXprcF80er19ot.jpg" },
  { name: "HBO Max", logo_path: "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg" },
  { name: "Hulu", logo_path: "/bxBlRPEPpMVDc4jMhSrTf2339DW.jpg" },
  { name: "Netflix", logo_path: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg" },
  { name: "Paramount Plus", logo_path: "/fts6X10Jn4QT0X6ac3udKEn2tJA.jpg" },
  { name: "Peacock", logo_path: "/2aGrp1xw3qhwCYvNGAJZPdjfeeX.jpg" },
];

interface ProviderPickerProps {
  onSelect: (provider: string) => void;
  onCancel: () => void;
}

export function ProviderPicker({ onSelect, onCancel }: ProviderPickerProps) {
  function handleSelect(provider: Provider) {
    onSelect(JSON.stringify([{ name: provider.name, logo_path: provider.logo_path }]));
  }

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Choose Service</h3>
        <div className={styles.grid}>
          {PROVIDERS.map((p) => (
            <button
              key={p.name}
              className={styles.option}
              onClick={() => handleSelect(p)}
              title={p.name}
              type="button"
            >
              <img src={getLogoUrl(p.logo_path) ?? ""} alt={p.name} className={styles.logo} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
