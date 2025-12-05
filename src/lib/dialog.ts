/**
 * Dialog Service
 * 
 * Native window.alert and window.confirm are difficult to test and can block execution.
 * This service provides an abstraction layer to handle dialogs.
 * 
 * It can be extended or mocked for testing purposes.
 */

export interface IDialogService {
  alert(message: string): void;
  confirm(message: string): boolean;
}

class NativeDialogService implements IDialogService {
  alert(message: string): void {
    if (typeof window !== 'undefined') {
      window.alert(message);
    } else {
      console.log(`[DialogService] Alert: ${message}`);
    }
  }

  confirm(message: string): boolean {
    if (typeof window !== 'undefined') {
      return window.confirm(message);
    }
    console.log(`[DialogService] Confirm: ${message} (Defaulting to false in server context)`);
    return false;
  }
}

// Singleton instance
export const dialogService = new NativeDialogService();

// For testing: Allow replacing the implementation
export const setDialogServiceImplementation = (impl: IDialogService) => {
  (dialogService as any).alert = impl.alert;
  (dialogService as any).confirm = impl.confirm;
};
