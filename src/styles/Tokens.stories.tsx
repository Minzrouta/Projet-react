import type { Meta, StoryObj } from '@storybook/react-vite'
import tokens from './tokens.module.scss'

// Page de référence des tokens Sass (src/styles/_tokens.scss). Les styles en ligne ne servent
// qu'à montrer les valeurs : aucun composant de l'application n'en utilise.

const COLORS = ['accent', 'accentDark', 'accentSoft', 'text', 'textMuted', 'bg', 'surface', 'border', 'success', 'successSoft', 'warning', 'warningSoft', 'danger', 'dangerSoft', 'info', 'infoSoft']
const SPACES = ['space1', 'space2', 'space3', 'space4', 'space5', 'space6']
const kebab = (name: string) => '$' + name.replace(/([A-Z0-9])/g, '-$1').toLowerCase()

function Colors() {
  return (
    <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: tokens.space4, listStyle: 'none', padding: 0 }}>
      {COLORS.map((name) => (
        <li key={name}>
          <div style={{ height: 56, background: tokens[name], border: `1px solid ${tokens.border}`, borderRadius: tokens.radiusSmall }} />
          <code>{kebab(name)}</code>
          <div>{tokens[name]}</div>
        </li>
      ))}
    </ul>
  )
}

function Spacing() {
  return (
    <ul style={{ display: 'grid', gap: tokens.space3, listStyle: 'none', padding: 0 }}>
      {SPACES.map((name) => (
        <li key={name} style={{ display: 'flex', alignItems: 'center', gap: tokens.space4 }}>
          <div style={{ width: tokens[name], height: tokens.space4, background: tokens.accent }} />
          <code>{kebab(name)}</code> {tokens[name]}
        </li>
      ))}
    </ul>
  )
}

const meta = {
  title: 'Fondations/Tokens',
  parameters: { controls: { disable: true } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Couleurs: Story = { render: () => <Colors /> }
export const Espacements: Story = { render: () => <Spacing /> }
