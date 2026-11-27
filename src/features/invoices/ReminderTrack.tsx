import { Button } from '../../components/Button'
import type { ReminderDto } from '../../lib/api'
import { day } from '../../lib/format'
import { cx } from '../../lib/cx'
import { REMINDER_LEVELS } from './invoice'
import './ReminderTrack.scss'

interface ReminderTrackProps {
  daysOverdue: number
  reminders: ReminderDto[]
  /** Niveau à envoyer maintenant, s'il y en a un. */
  reminderDue: number | null
  /** Faux quand la facture est soldée : plus rien à relancer. */
  open: boolean
  pending?: boolean
  onSend: (level: number) => void
}

/** Les trois paliers de relance d'une facture (J+7, J+15, J+30) et où elle en est. */
export function ReminderTrack({ daysOverdue, reminders, reminderDue, open, pending = false, onSend }: ReminderTrackProps) {
  return (
    <ol className="reminder-track">
      {REMINDER_LEVELS.map(({ level, days, label }) => {
        const sent = reminders.find((r) => r.level === level)
        const due = reminderDue === level
        return (
          <li key={level} className={cx('reminder-track__step', sent && 'reminder-track__step--sent', due && 'reminder-track__step--due')}>
            <span className="reminder-track__marker" aria-hidden="true">
              {sent ? '✓' : level}
            </span>
            <div>
              <div className="reminder-track__label">
                Niveau {level} : {label} (J+{days})
              </div>
              <div className="reminder-track__status">
                {sent
                  ? `Envoyée le ${day(sent.sentAt)} par ${sent.sentByName}`
                  : due
                    ? 'À envoyer'
                    : !open
                      ? 'Sans objet, la facture est soldée'
                      : daysOverdue >= days
                        ? 'Palier dépassé sans envoi'
                        : daysOverdue > 0
                          ? `Dans ${days - daysOverdue} j si la facture reste impayée`
                          : "Possible après l'échéance"}
              </div>
            </div>
            {due && (
              <Button variant="primary" size="small" loading={pending} onClick={() => onSend(level)}>
                Enregistrer la relance de niveau {level}
              </Button>
            )}
          </li>
        )
      })}
    </ol>
  )
}
