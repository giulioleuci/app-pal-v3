import HelpIcon from '@mui/icons-material/Help';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { AccordionGroup } from '../AccordionGroup';

const meta: Meta<typeof AccordionGroup> = {
  title: 'Shared/Components/AccordionGroup',
  component: AccordionGroup,
  tags: ['autodocs'],
  argTypes: {
    expanded: {
      control: 'text',
      description: 'Currently expanded panel ID (for controlled mode)',
    },
    onChange: {
      action: 'onChange',
      description: 'Callback fired when a panel is expanded/collapsed',
    },
    allowMultiple: {
      control: 'boolean',
      description: 'Whether multiple panels can be expanded at once',
    },
    defaultExpanded: {
      control: 'text',
      description: 'Default expanded panel ID (for uncontrolled mode)',
    },
    children: {
      control: false,
      description: 'Accordion items composed using AccordionGroup.Item',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
A compound component for creating groups of accordion panels with exclusive
or multiple expansion modes. Provides consistent styling and behavior for
collapsible content sections.

## Compound Components
- **AccordionGroup.Item**: Individual accordion panel with title, optional subtitle, and content

## Features
- Exclusive or multiple expansion modes
- Controlled and uncontrolled modes
- Icons support in panel headers
- Consistent styling and animations
- Disabled state support
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AccordionGroup>;

const ControlledAccordionWrapper = (args: any) => {
  const [expanded, setExpanded] = useState<string | null>('panel1');

  return (
    <AccordionGroup {...args} expanded={expanded} onChange={setExpanded}>
      <AccordionGroup.Item
        id='panel1'
        title='General Settings'
        subtitle='Configure basic application settings'
        icon={<SettingsIcon />}
      >
        <Typography paragraph>
          Here you can configure general application settings such as theme, language preferences,
          and default behaviors.
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary='Theme' secondary='Dark mode enabled' />
          </ListItem>
          <ListItem>
            <ListItemText primary='Language' secondary='English (US)' />
          </ListItem>
          <ListItem>
            <ListItemText primary='Timezone' secondary='UTC-5 (Eastern)' />
          </ListItem>
        </List>
      </AccordionGroup.Item>

      <AccordionGroup.Item
        id='panel2'
        title='Account Information'
        subtitle='View and edit your account details'
        icon={<InfoIcon />}
      >
        <Typography paragraph>Manage your personal information and account preferences.</Typography>
        <Typography>
          <strong>Name:</strong> John Doe
        </Typography>
        <Typography>
          <strong>Email:</strong> john.doe@example.com
        </Typography>
        <Typography>
          <strong>Member since:</strong> January 2023
        </Typography>
        <Typography sx={{ mt: 2 }}>
          <Chip label='Premium' color='primary' size='small' />
        </Typography>
      </AccordionGroup.Item>

      <AccordionGroup.Item
        id='panel3'
        title='Help & Support'
        subtitle='Get help and find answers'
        icon={<HelpIcon />}
      >
        <Typography paragraph>
          Find answers to common questions and get support for any issues.
        </Typography>
        <List>
          <ListItem>
            <ListItemText primary='Frequently Asked Questions' />
          </ListItem>
          <ListItem>
            <ListItemText primary='Contact Support' />
          </ListItem>
          <ListItem>
            <ListItemText primary='User Guide' />
          </ListItem>
          <ListItem>
            <ListItemText primary='Video Tutorials' />
          </ListItem>
        </List>
      </AccordionGroup.Item>
    </AccordionGroup>
  );
};

export const Default: Story = {
  args: {},
  render: (args) => <ControlledAccordionWrapper {...args} />,
};

export const MultipleExpansion: Story = {
  args: {
    allowMultiple: true,
    defaultExpanded: 'item1',
  },
  render: (args) => (
    <AccordionGroup {...args}>
      <AccordionGroup.Item
        id='item1'
        title='Project Overview'
        subtitle='Key information about this project'
      >
        <Typography paragraph>
          This project is designed to showcase the capabilities of our accordion component with
          multiple expansion support.
        </Typography>
        <Typography>
          <strong>Status:</strong> In Progress
          <br />
          <strong>Due Date:</strong> December 31, 2024
          <br />
          <strong>Team Size:</strong> 5 members
        </Typography>
      </AccordionGroup.Item>

      <AccordionGroup.Item id='item2' title='Recent Activity' subtitle='Latest updates and changes'>
        <List dense>
          <ListItem>
            <ListItemText primary='Task completed: Design review' secondary='2 hours ago' />
          </ListItem>
          <ListItem>
            <ListItemText primary='New comment added' secondary='5 hours ago' />
          </ListItem>
          <ListItem>
            <ListItemText primary='File uploaded: wireframes.pdf' secondary='1 day ago' />
          </ListItem>
        </List>
      </AccordionGroup.Item>

      <AccordionGroup.Item
        id='item3'
        title='Team Members'
        subtitle='People working on this project'
      >
        <List>
          <ListItem>
            <ListItemText primary='Alice Johnson' secondary='Project Manager' />
          </ListItem>
          <ListItem>
            <ListItemText primary='Bob Smith' secondary='Lead Developer' />
          </ListItem>
          <ListItem>
            <ListItemText primary='Carol Davis' secondary='UI/UX Designer' />
          </ListItem>
        </List>
      </AccordionGroup.Item>
    </AccordionGroup>
  ),
};

export const WithDisabledItems: Story = {
  args: {},
  render: function WithState(args) {
    const [expanded, setExpanded] = useState<string | null>(null);

    return (
      <AccordionGroup {...args} expanded={expanded} onChange={setExpanded}>
        <AccordionGroup.Item
          id='available'
          title='Available Feature'
          subtitle='This feature is ready to use'
        >
          <Typography>
            This accordion panel is fully functional and can be expanded and collapsed as normal.
          </Typography>
        </AccordionGroup.Item>

        <AccordionGroup.Item
          id='disabled'
          title='Coming Soon'
          subtitle='This feature is under development'
          disabled
        >
          <Typography>This content won't be shown because the panel is disabled.</Typography>
        </AccordionGroup.Item>

        <AccordionGroup.Item
          id='maintenance'
          title='Under Maintenance'
          subtitle='Temporarily unavailable'
          disabled
        >
          <Typography>This feature is temporarily disabled for maintenance.</Typography>
        </AccordionGroup.Item>
      </AccordionGroup>
    );
  },
};

export const SimpleContent: Story = {
  args: {
    defaultExpanded: 'faq1',
  },
  render: (args) => (
    <AccordionGroup {...args}>
      <AccordionGroup.Item id='faq1' title='What is this component for?'>
        <Typography>
          This accordion component is designed to organize content into collapsible sections, making
          it easy to navigate through large amounts of information.
        </Typography>
      </AccordionGroup.Item>

      <AccordionGroup.Item id='faq2' title='How do I use it?'>
        <Typography>
          Simply wrap your content in AccordionGroup.Item components and provide an id and title for
          each section.
        </Typography>
      </AccordionGroup.Item>

      <AccordionGroup.Item id='faq3' title='Can I customize the appearance?'>
        <Typography>
          Yes! The component uses Material-UI theming, so you can customize colors, spacing, and
          other visual aspects through your theme.
        </Typography>
      </AccordionGroup.Item>
    </AccordionGroup>
  ),
};
