import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';

const StyledAccordionGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  '&.Mui-expanded': {
    margin: 0,
  },
  '&:before': {
    display: 'none',
  },
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  '&.Mui-expanded:not(:last-child)': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme: _theme }) => ({
  '&.Mui-expanded': {
    minHeight: 48,
  },
  '& .MuiAccordionSummary-content': {
    '&.Mui-expanded': {
      margin: '12px 0',
    },
  },
}));

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingTop: 0,
}));

export interface AccordionGroupProps {
  /**
   * Currently expanded panel ID (for controlled mode)
   */
  expanded?: string | null;
  /**
   * Callback fired when a panel is expanded/collapsed
   */
  onChange?: (panelId: string | null) => void;
  /**
   * Whether multiple panels can be expanded at once
   */
  allowMultiple?: boolean;
  /**
   * Default expanded panel ID (for uncontrolled mode)
   */
  defaultExpanded?: string;
  /**
   * Accordion items
   */
  children: React.ReactNode;
  /**
   * Test identifier for the accordion group
   */
  'data-testid'?: string;
}

export interface AccordionItemProps {
  /**
   * Unique identifier for this panel
   */
  id: string;
  /**
   * Title of the accordion panel
   */
  title: string;
  /**
   * Subtitle or description (optional)
   */
  subtitle?: string;
  /**
   * Content to display when expanded
   */
  children: React.ReactNode;
  /**
   * Whether this panel is disabled
   */
  disabled?: boolean;
  /**
   * Icon to show in the summary (optional)
   */
  icon?: React.ReactNode;
  /**
   * Test identifier for the accordion item
   */
  'data-testid'?: string;
  /**
   * Whether this panel is currently expanded (internal use)
   */
  isExpanded?: boolean;
  /**
   * Callback for expansion change (internal use)
   */
  onExpansionChange?: (panelId: string, isExpanded: boolean) => void;
}

/**
 * Accordion item component
 */
const AccordionItem = ({
  id,
  title,
  subtitle,
  children,
  disabled = false,
  icon,
  'data-testid': testId,
  isExpanded = false,
  onExpansionChange,
}: AccordionItemProps) => {
  const handleChange = (_: React.SyntheticEvent, expanded: boolean) => {
    onExpansionChange?.(id, expanded);
  };

  return (
    <StyledAccordion
      expanded={isExpanded}
      onChange={handleChange}
      disabled={disabled}
      data-testid={testId || `accordion-item-${id}`}
    >
      <StyledAccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${id}-content`}
        id={`${id}-header`}
        data-testid={`accordion-summary-${id}`}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          {icon}
          <Box sx={{ flex: 1 }}>
            <Typography variant='subtitle1' component='div'>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant='body2' color='text.secondary'>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </StyledAccordionSummary>

      <StyledAccordionDetails data-testid={`accordion-content-${id}`}>
        {children}
      </StyledAccordionDetails>
    </StyledAccordion>
  );
};

/**
 * A compound component for creating groups of accordion panels with exclusive
 * or multiple expansion modes. Provides consistent styling and behavior for
 * collapsible content sections.
 *
 * @example
 * ```tsx
 * // Controlled mode with exclusive expansion
 * <AccordionGroup expanded={expandedPanel} onChange={setExpandedPanel}>
 *   <AccordionGroup.Item id="panel1" title="First Panel">
 *     <Typography>Content for first panel</Typography>
 *   </AccordionGroup.Item>
 *   <AccordionGroup.Item id="panel2" title="Second Panel" subtitle="With subtitle">
 *     <Typography>Content for second panel</Typography>
 *   </AccordionGroup.Item>
 * </AccordionGroup>
 *
 * // Uncontrolled mode with multiple expansion
 * <AccordionGroup allowMultiple defaultExpanded="panel1">
 *   <AccordionGroup.Item id="panel1" title="Always Expanded">
 *     <Typography>This starts expanded</Typography>
 *   </AccordionGroup.Item>
 * </AccordionGroup>
 * ```
 */
export const AccordionGroup = ({
  expanded,
  onChange,
  allowMultiple = false,
  defaultExpanded,
  children,
  'data-testid': testId = 'accordion-group',
}: AccordionGroupProps) => {
  const [internalExpanded, setInternalExpanded] = React.useState<Set<string>>(
    () => new Set(defaultExpanded ? [defaultExpanded] : [])
  );

  const isControlled = expanded !== undefined;
  const currentExpanded = isControlled ? new Set(expanded ? [expanded] : []) : internalExpanded;

  const handleExpansionChange = (panelId: string, isExpanded: boolean) => {
    if (isControlled) {
      // Controlled mode
      if (allowMultiple) {
        // For multiple mode in controlled state, we need a different prop structure
        // This is a simplified implementation for exclusive mode
        onChange?.(isExpanded ? panelId : null);
      } else {
        // Exclusive mode
        onChange?.(isExpanded ? panelId : null);
      }
    } else {
      // Uncontrolled mode
      setInternalExpanded((prev) => {
        const newExpanded = new Set(prev);
        if (isExpanded) {
          if (!allowMultiple) {
            newExpanded.clear();
          }
          newExpanded.add(panelId);
        } else {
          newExpanded.delete(panelId);
        }
        return newExpanded;
      });
    }
  };

  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === AccordionItem) {
      const panelId = child.props.id;
      return React.cloneElement(child as React.ReactElement<AccordionItemProps>, {
        isExpanded: currentExpanded.has(panelId),
        onExpansionChange: handleExpansionChange,
      });
    }
    return child;
  });

  return <StyledAccordionGroup data-testid={testId}>{enhancedChildren}</StyledAccordionGroup>;
};

// Attach compound components
AccordionGroup.Item = AccordionItem;
