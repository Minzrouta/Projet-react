import type { Preview } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import '../src/styles/base.scss'

const preview: Preview = {
  // Une page de documentation est générée pour chaque composant à partir de ses props et de ses stories.
  tags: ['autodocs'],
  decorators: [
    // Les composants qui utilisent Link ou NavLink ont besoin d'un routeur.
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: { order: ['Fondations', 'Composants'] },
    },
    a11y: {
      // Une violation d'accessibilité fait échouer le test de la story.
      test: 'error',
    },
  },
}

export default preview
