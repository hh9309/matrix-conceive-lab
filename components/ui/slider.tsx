import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  onValueChange,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min]

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full relative flex items-center select-none touch-none", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col min-h-6">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-slate-200 data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5 cursor-pointer"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-indigo-600 data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {_values.map((_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="relative block size-5 shrink-0 rounded-full border-2 border-indigo-600 bg-white shadow-md transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing z-20"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
