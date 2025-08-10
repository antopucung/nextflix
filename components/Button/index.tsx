import styles from '../../styles/Button.module.scss';
import { IconType } from 'react-icons';

interface ButtonProps {
  filled?: boolean;
  label?: string;
  Icon: IconType;
  rounded?: boolean;
  onClick?: () => void;
}

export default function Button(props: ButtonProps): React.ReactElement {
  const { filled, label, Icon, rounded, onClick } = props;

  const baseClass = !rounded ? styles.button : filled ? styles.roundButton : styles.outlineRounded;

  return (
    <button className={baseClass} onClick={onClick}>
      <Icon className={styles.icon} />
      {!rounded && <span className={styles.label}>{label}</span>}
    </button>
  );
}
