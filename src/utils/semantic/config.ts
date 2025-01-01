import { ConfigType } from './types';

export const ConfigStructure: ConfigType = {
  layouts: {
    patterns: [
      {
        type: 'fullscreen',
        indicators: {
          classNames: ['min-h-screen', 'h-screen', 'w-full'],
          elements: ['section', 'div']
        }
      },
      {
        type: 'container',
        indicators: {
          classNames: ['container', 'mx-auto', 'px-'],
          elements: ['div']
        }
      },
      {
        type: 'grid',
        indicators: {
          classNames: ['grid', 'grid-cols-'],
          elements: ['div']
        }
      }
    ]
  },

  sections: {
    patterns: [
      {
        type: 'hero',
        indicators: {
          classNames: ['hero', 'banner', 'py-16', 'py-32'],
          elements: ['section', 'h1', 'h2']
        }
      },
      {
        type: 'features',
        indicators: {
          classNames: ['features', 'grid', 'gap-'],
          elements: ['section', 'div']
        }
      }
    ]
  },

  elements: {
    primary: {
      patterns: [
        {
          type: 'heading',
          indicators: {
            classNames: ['text-3xl', 'text-4xl', 'font-bold'],
            elements: ['h1', 'h2']
          }
        },
        {
          type: 'cta-button',
          indicators: {
            classNames: ['btn', 'button'],
            elements: ['Button'],
            attributes: {
              variant: ['default', 'primary']
            }
          }
        }
      ]
    },
    media: {
      patterns: [
        {
          type: 'image',
          indicators: {
            classNames: ['object-cover', 'rounded'],
            elements: ['Image', 'img']
          }
        },
        {
          type: 'video',
          indicators: {
            classNames: ['aspect-video'],
            elements: ['video', 'iframe']
          }
        }
      ]
    }
  },

  useCases: [
    {
      name: 'Landing Page Hero',
      requirements: {
        layout: ['fullscreen', 'container'],
        elements: ['heading', 'cta-button'],
        interactivity: ['button']
      },
      priority: 1
    },
    {
      name: 'Feature Showcase',
      requirements: {
        layout: ['grid'],
        elements: ['heading', 'image']
      },
      priority: 2
    }
  ]
}; 