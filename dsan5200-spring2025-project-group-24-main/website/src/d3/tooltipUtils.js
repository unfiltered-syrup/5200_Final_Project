import * as d3 from 'd3';

/**
 * Gets the current theme mode from theme object
 */
export const getCurrentTheme = (theme) => {
  return theme?.palette?.mode === 'dark' ? 'dark' : 'light';
};

/**
 * Creates or updates a single tooltip div based on the current theme.
 * Adds the appropriate theme class (`tooltip--light` or `tooltip--dark`).
 */
export const createTooltip = (theme) => {
  // Remove any existing tooltips to avoid duplicates
  d3.select('body').selectAll('.tooltip').remove();
  
  const themeMode = getCurrentTheme(theme);

  // Create tooltip with enhanced styling
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', `tooltip tooltip--${themeMode}`)
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('background-color', themeMode === 'dark' ? '#424242' : '#ffffff')
    .style('color', themeMode === 'dark' ? '#ffffff' : '#333333')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('z-index', 10000)
    .style('max-width', '300px')
    .style('box-shadow', '0 2px 10px rgba(0,0,0,0.2)')
    .style('transition', 'opacity 0.2s');
    
  return tooltip;
};

/**
 * Displays the tooltip with given HTML content and positions it near the cursor.
 * Tracks mouse movement to follow.
 */
export const showTooltip = (tooltip, event, htmlContent) => {
  if (!tooltip) return;
  
  tooltip
    .html(htmlContent)
    .style('left', `${event.pageX + 12}px`)
    .style('top', `${event.pageY - 28}px`)
    .transition()
    .duration(200)
    .style('opacity', 0.97);

  // Track mouse movement for tooltip positioning
  d3.select('body').on('mousemove.tooltip', function (event) {
    // Calculate position - avoid edge of screen
    const tooltipNode = tooltip.node();
    const tooltipWidth = tooltipNode ? tooltipNode.offsetWidth : 200;
    const tooltipHeight = tooltipNode ? tooltipNode.offsetHeight : 100;
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Default position
    let left = event.pageX + 12;
    let top = event.pageY - 28;
    
    // Adjust if tooltip would go off right edge
    if (left + tooltipWidth > windowWidth - 20) {
      left = event.pageX - tooltipWidth - 12;
    }
    
    // Adjust if tooltip would go off bottom edge
    if (top + tooltipHeight > windowHeight - 20) {
      top = event.pageY - tooltipHeight - 12;
    }
    
    // Ensure tooltip never goes off left or top edge
    left = Math.max(10, left);
    top = Math.max(10, top);
    
    tooltip
      .style('left', `${left}px`)
      .style('top', `${top}px`);
  });
};

/**
 * Hides the tooltip and stops tracking mouse movement.
 */
export const hideTooltip = (tooltip) => {
  if (!tooltip) return;
  
  tooltip.transition()
    .duration(200)
    .style('opacity', 0);
    
  d3.select('body').on('mousemove.tooltip', null);
};

/**
 * Updates tooltip theme manually when theme changes.
 * Can be called on theme toggle.
 */
export const updateTooltipTheme = (theme) => {
  const tooltip = d3.select('body').select('.tooltip');
  if (!tooltip.empty()) {
    const themeMode = getCurrentTheme(theme);
    
    tooltip
      .attr('class', `tooltip tooltip--${themeMode}`)
      .style('background-color', themeMode === 'dark' ? '#424242' : '#ffffff')
      .style('color', themeMode === 'dark' ? '#ffffff' : '#333333');
  }
};

// Add CSS for tooltips to document if it doesn't exist
export const injectTooltipStyles = () => {
  const styleId = 'tooltip-injected-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .tooltip {
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        opacity: 0;
        position: absolute;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: opacity 0.2s;
      }
      
      .tooltip--light {
        background-color: #ffffff;
        color: #333333;
        border: 1px solid #e0e0e0;
      }
      
      .tooltip--dark {
        background-color: #424242;
        color: #ffffff;
        border: 1px solid #616161;
      }
    `;
    document.head.appendChild(style);
  }
};