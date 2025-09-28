interface ViewportBounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface ModalBounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface ModalPositioningIssue {
  type: 'outside_viewport' | 'partially_visible' | 'centering_issue';
  details: {
    modalBounds: ModalBounds;
    viewportBounds: ViewportBounds;
    issues: string[];
  };
}

export const checkModalPositioning = (modalElement: HTMLElement | null): ModalPositioningIssue | null => {
  if (!modalElement) return null;

  const viewportBounds: ViewportBounds = {
    top: 0,
    left: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
    width: window.innerWidth,
    height: window.innerHeight
  };

  const modalRect = modalElement.getBoundingClientRect();
  const modalBounds: ModalBounds = {
    top: modalRect.top,
    left: modalRect.left,
    right: modalRect.right,
    bottom: modalRect.bottom,
    width: modalRect.width,
    height: modalRect.height
  };

  const issues: string[] = [];

  // Check if modal is outside viewport
  if (modalBounds.right < viewportBounds.left) {
    issues.push(`Modal is completely to the left of viewport (right: ${modalBounds.right}, viewport left: ${viewportBounds.left})`);
  }
  if (modalBounds.left > viewportBounds.right) {
    issues.push(`Modal is completely to the right of viewport (left: ${modalBounds.left}, viewport right: ${viewportBounds.right})`);
  }
  if (modalBounds.bottom < viewportBounds.top) {
    issues.push(`Modal is completely above viewport (bottom: ${modalBounds.bottom}, viewport top: ${viewportBounds.top})`);
  }
  if (modalBounds.top > viewportBounds.bottom) {
    issues.push(`Modal is completely below viewport (top: ${modalBounds.top}, viewport bottom: ${viewportBounds.bottom})`);
  }

  // Check if modal is partially visible
  if (modalBounds.left < viewportBounds.left || modalBounds.right > viewportBounds.right) {
    issues.push(`Modal extends horizontally outside viewport (left: ${modalBounds.left}, right: ${modalBounds.right}, viewport: ${viewportBounds.left}-${viewportBounds.right})`);
  }
  if (modalBounds.top < viewportBounds.top || modalBounds.bottom > viewportBounds.bottom) {
    issues.push(`Modal extends vertically outside viewport (top: ${modalBounds.top}, bottom: ${modalBounds.bottom}, viewport: ${viewportBounds.top}-${viewportBounds.bottom})`);
  }

  // Check centering
  const expectedCenterX = viewportBounds.width / 2;
  const expectedCenterY = viewportBounds.height / 2;
  const actualCenterX = modalBounds.left + (modalBounds.width / 2);
  const actualCenterY = modalBounds.top + (modalBounds.height / 2);
  const centerTolerance = 50; // pixels

  if (Math.abs(actualCenterX - expectedCenterX) > centerTolerance) {
    issues.push(`Modal not horizontally centered (expected: ${expectedCenterX}, actual: ${actualCenterX}, difference: ${Math.abs(actualCenterX - expectedCenterX)})`);
  }
  if (Math.abs(actualCenterY - expectedCenterY) > centerTolerance) {
    issues.push(`Modal not vertically centered (expected: ${expectedCenterY}, actual: ${actualCenterY}, difference: ${Math.abs(actualCenterY - expectedCenterY)})`);
  }

  if (issues.length === 0) return null;

  const type = issues.some(issue => issue.includes('completely')) ? 'outside_viewport' :
              issues.some(issue => issue.includes('extends')) ? 'partially_visible' :
              'centering_issue';

  return {
    type,
    details: {
      modalBounds,
      viewportBounds,
      issues
    }
  };
};

export const logModalPositioning = (modalElement: HTMLElement | null, modalName: string) => {
  const issue = checkModalPositioning(modalElement);
  
  if (issue) {
    console.error(`❌ [ModalDebugger] ${modalName} positioning issue detected:`, {
      type: issue.type,
      modalName,
      details: issue.details,
      timestamp: new Date().toISOString()
    });
  } else {
    console.log(`✅ [ModalDebugger] ${modalName} positioned correctly:`, {
      modalName,
      bounds: modalElement ? modalElement.getBoundingClientRect() : null,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const createModalDebugger = (modalName: string) => {
  return (modalElement: HTMLElement | null) => {
    logModalPositioning(modalElement, modalName);
  };
};

// Global debugger for all modals on the page
export const debugAllModals = () => {
  console.log('🔍 [ModalDebugger] Checking all modals on page...');
  
  // Find all elements with fixed positioning and high z-index (our modal containers)
  const allFixedElements = document.querySelectorAll('[style*="position: fixed"]');
  const modalContainers = Array.from(allFixedElements).filter(element => {
    const style = window.getComputedStyle(element);
    const zIndex = parseInt(style.zIndex) || 0;
    return zIndex >= 50; // Our modals use z-index: 50
  });
  
  console.log(`Found ${modalContainers.length} potential modal containers`);
  
  modalContainers.forEach((container, index) => {
    const modalElement = container as HTMLElement;
    const modalName = `Modal-${index + 1}`;
    
    console.log(`Checking ${modalName}:`, {
      element: modalElement,
      computedStyle: window.getComputedStyle(modalElement),
      boundingRect: modalElement.getBoundingClientRect(),
      innerHTML: modalElement.innerHTML.substring(0, 200) + '...'
    });
    
    logModalPositioning(modalElement, modalName);
  });
  
  // Also check for any elements with modal-related classes
  const modalElements = document.querySelectorAll('.modal, [class*="modal"], [class*="Modal"], [class*="dialog"], [class*="Dialog"]');
  console.log(`Found ${modalElements.length} elements with modal-related classes`);
  
  modalElements.forEach((element, index) => {
    const modalElement = element as HTMLElement;
    const modalName = `ModalClass-${index + 1}`;
    
    logModalPositioning(modalElement, modalName);
  });

  // Check for any elements that might be modals based on content
  const potentialModals = document.querySelectorAll('div[style*="backdrop-blur"], div[style*="bg-black"]');
  console.log(`Found ${potentialModals.length} potential backdrop elements`);
  
  potentialModals.forEach((element, index) => {
    const modalElement = element as HTMLElement;
    const modalName = `Backdrop-${index + 1}`;
    
    console.log(`Checking ${modalName}:`, {
      element: modalElement,
      computedStyle: window.getComputedStyle(modalElement),
      boundingRect: modalElement.getBoundingClientRect()
    });
    
    logModalPositioning(modalElement, modalName);
  });

  // Check for any visible overlays
  const overlays = document.querySelectorAll('div[style*="inset-0"], div[style*="fixed"]');
  console.log(`Found ${overlays.length} potential overlay elements`);
  
  overlays.forEach((element, index) => {
    const modalElement = element as HTMLElement;
    const style = window.getComputedStyle(modalElement);
    const zIndex = parseInt(style.zIndex) || 0;
    
    if (zIndex > 10) { // Only check high z-index elements
      const modalName = `Overlay-${index + 1}`;
      
      console.log(`Checking ${modalName}:`, {
        element: modalElement,
        computedStyle: style,
        boundingRect: modalElement.getBoundingClientRect(),
        zIndex: zIndex
      });
      
      logModalPositioning(modalElement, modalName);
    }
  });
};

// Simple debugger for currently visible modals
export const debugVisibleModals = () => {
  console.log('👀 [ModalDebugger] Checking currently visible modals...');
  
  // Find all elements that are currently visible and might be modals
  const allDivs = document.querySelectorAll('div');
  const visibleModals = Array.from(allDivs).filter(div => {
    const style = window.getComputedStyle(div);
    const rect = div.getBoundingClientRect();
    
    // Check if element is visible and positioned as a modal
    return (
      style.position === 'fixed' &&
      parseInt(style.zIndex) >= 50 &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  });
  
  console.log(`Found ${visibleModals.length} currently visible modal-like elements`);
  
  visibleModals.forEach((element, index) => {
    const modalElement = element as HTMLElement;
    const modalName = `VisibleModal-${index + 1}`;
    
    console.log(`Checking ${modalName}:`, {
      element: modalElement,
      computedStyle: window.getComputedStyle(modalElement),
      boundingRect: modalElement.getBoundingClientRect(),
      zIndex: window.getComputedStyle(modalElement).zIndex
    });
    
    logModalPositioning(modalElement, modalName);
  });
  
  return visibleModals;
};

// Debug active modals from global registry
export const debugActiveModals = () => {
  console.log('🎯 [ModalDebugger] Checking active modals from registry...');
  
  if (typeof window === 'undefined' || !(window as any).activeModals) {
    console.log('No active modals registry found');
    return;
  }
  
  const activeModals = (window as any).activeModals as Map<string, HTMLElement>;
  console.log(`Found ${activeModals.size} active modals in registry`);
  
  activeModals.forEach((modalElement, modalName) => {
    console.log(`Checking active modal: ${modalName}`, {
      element: modalElement,
      computedStyle: window.getComputedStyle(modalElement),
      boundingRect: modalElement.getBoundingClientRect()
    });
    
    logModalPositioning(modalElement, `Active-${modalName}`);
  });
};

// Make debuggers available globally
if (typeof window !== 'undefined') {
  (window as any).debugAllModals = debugAllModals;
  (window as any).debugVisibleModals = debugVisibleModals;
  (window as any).debugActiveModals = debugActiveModals;
  console.log('🛠️ [ModalDebugger] Global debuggers available:');
  console.log('  - debugAllModals() - Check all potential modals');
  console.log('  - debugVisibleModals() - Check currently visible modals');
  console.log('  - debugActiveModals() - Check active modals from registry');
}
