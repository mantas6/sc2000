/**
 * Settings modal — opened from the header gear button.
 *
 * Bundles the modern quality-of-life controls that don't belong in the HUD:
 *  - Save export/import: copy the current save as a base64 blob, or paste one
 *    back in (validated, with inline error feedback).
 *  - Offline progression toggle (persisted via `settings.ts`).
 *  - Hard reset: wipe the save and start a fresh life (with confirm).
 *
 * Local component state only; it reaches the store through `dispatch`/`reset`.
 * Styling reuses the shared `.modal` chrome to match the dark theme.
 */

import { useState } from 'react'
import { clearSave, exportSave, importSave } from '../game/persistence'
import { isOfflineEnabled, setOfflineEnabled } from '../game/settings'
import { roleIcon } from '../ui/icons'
import { useGame } from '../store/GameContext'

export interface SettingsModalProps {
  /** Close the modal (owned by the header). */
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { state, dispatch, reset } = useGame()

  const [exported] = useState(() => exportSave(state.game))
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [offline, setOffline] = useState(isOfflineEnabled)

  const Gear = roleIcon.settings
  const Skull = roleIcon.reset

  const copyExport = () => {
    void navigator.clipboard?.writeText(exported).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      },
      () => setCopied(false),
    )
  }

  const doImport = () => {
    const parsed = importSave(importText)
    if (parsed === null) {
      setImportError('That save code is not valid. Check you copied the whole thing.')
      return
    }
    dispatch({ type: 'LOAD', state: parsed })
    onClose()
  }

  const toggleOffline = () => {
    const next = !offline
    setOffline(next)
    setOfflineEnabled(next)
  }

  const doHardReset = () => {
    clearSave()
    reset()
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="settings-title" className="modal__title">
          <Gear size={22} /> Settings
        </h2>

        <section className="settings__section">
          <h3 className="settings__heading">Offline progression</h3>
          <label className="settings__toggle">
            <input type="checkbox" checked={offline} onChange={toggleOffline} />
            <span>Simulate progress while the game is closed (up to 8 hours).</span>
          </label>
        </section>

        <section className="settings__section">
          <h3 className="settings__heading">Export save</h3>
          <p className="settings__hint">Copy this code to back up or move your save.</p>
          <textarea
            className="settings__blob"
            readOnly
            rows={3}
            value={exported}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Exported save code"
          />
          <div className="settings__row">
            <button type="button" className="btn" onClick={copyExport}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </section>

        <section className="settings__section">
          <h3 className="settings__heading">Import save</h3>
          <p className="settings__hint">Paste a save code to replace your current game.</p>
          <textarea
            className="settings__blob"
            rows={3}
            value={importText}
            placeholder="Paste your save code here…"
            onChange={(e) => {
              setImportText(e.target.value)
              setImportError(null)
            }}
            aria-label="Save code to import"
          />
          {importError ? (
            <p className="settings__error" role="alert">
              {importError}
            </p>
          ) : null}
          <div className="settings__row">
            <button
              type="button"
              className="btn"
              onClick={doImport}
              disabled={importText.trim() === ''}
            >
              Import
            </button>
          </div>
        </section>

        <section className="settings__section">
          <h3 className="settings__heading">Danger zone</h3>
          {confirmingReset ? (
            <div className="settings__confirm">
              <span>Delete your save and start over? There is no undo.</span>
              <div className="settings__row">
                <button type="button" className="btn" onClick={() => setConfirmingReset(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn--danger" onClick={doHardReset}>
                  <Skull size={16} /> Hard reset
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => setConfirmingReset(true)}
            >
              <Skull size={16} /> Hard reset
            </button>
          )}
        </section>

        <div className="modal__actions">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
