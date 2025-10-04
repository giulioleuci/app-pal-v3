export default function (plop) {
  plop.setGenerator('component', {
    description: 'Create a new React component in a feature slice',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name (e.g., ProfileCard)?',
      },
      {
        type: 'input',
        name: 'feature',
        message: 'Feature name (e.g., profile)?',
        default: 'common',
      },
    ],
    actions: (data) => {
      const basePath =
        data.feature === 'common'
          ? 'src/shared/components'
          : `src/features/{{kebabCase feature}}/components`;
      return [
        {
          type: 'add',
          path: `${basePath}/{{pascalCase name}}.tsx`,
          templateFile: 'plop-templates/component.hbs',
        },
        {
          type: 'add',
          path: `${basePath}/__tests__/{{pascalCase name}}.test.tsx`,
          templateFile: 'plop-templates/test.hbs',
        },
        {
          type: 'add',
          path: `${basePath}/__stories__/{{pascalCase name}}.stories.tsx`,
          templateFile: 'plop-templates/story.hbs',
        },
      ];
    },
  });

  plop.setGenerator('feature', {
    description: 'Create a new feature slice with FSD structure',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Feature name (e.g., profile)?',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/features/{{kebabCase name}}/index.ts',
        templateFile: 'plop-templates/feature-index.hbs',
      },
      { type: 'add', path: 'src/features/{{kebabCase name}}/components/.gitkeep', template: '' },
      { type: 'add', path: 'src/features/{{kebabCase name}}/data/.gitkeep', template: '' },
      { type: 'add', path: 'src/features/{{kebabCase name}}/domain/.gitkeep', template: '' },
      { type: 'add', path: 'src/features/{{kebabCase name}}/hooks/.gitkeep', template: '' },
      { type: 'add', path: 'src/features/{{kebabCase name}}/query-services/.gitkeep', template: '' },
      { type: 'add', path: 'src/features/{{kebabCase name}}/store/.gitkeep', template: '' },
      { type: 'add', path: 'src/features/{{kebabCase name}}/machines/.gitkeep', template: '' },
      { type: 'add', path: 'src/features/{{kebabCase name}}/views/.gitkeep', template: '' },
      { type: 'add', path: 'src/features/{{kebabCase name}}/types/.gitkeep', template: '' },
      { type: 'add', path: 'src/features/{{kebabCase name}}/utils/.gitkeep', template: '' },
    ],
  });
}