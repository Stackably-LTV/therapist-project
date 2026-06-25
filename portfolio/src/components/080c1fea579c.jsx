import { useToast } from "@/components/45a93a182304";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, } from "@/components/433ae57d4a2f";
export function Toaster() {
    const { toasts } = useToast();
    return (<ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
            return (<Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (<ToastDescription>{description}</ToastDescription>)}
            </div>
            {action}
            <ToastClose />
          </Toast>);
        })}
      <ToastViewport />
    </ToastProvider>);
}
