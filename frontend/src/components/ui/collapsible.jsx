import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

export function Collapsible({ children, defaultOpen = true, className = "" }) {
  return (
    <CollapsiblePrimitive.Root defaultOpen={defaultOpen} className={className}>
      {children}
    </CollapsiblePrimitive.Root>
  );
}

export function CollapsibleTrigger({ children, className = "", ...props }) {
  return (
    <CollapsiblePrimitive.Trigger className={`w-full text-left ${className}`} {...props}>
      {children}
    </CollapsiblePrimitive.Trigger>
  );
}

export function CollapsibleContent({ children, className = "" }) {
  return <CollapsiblePrimitive.Content className={className}>{children}</CollapsiblePrimitive.Content>;
}
