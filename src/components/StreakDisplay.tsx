type Props = {
  streak: number
  size?: 'sm' | 'lg'
}

export function StreakDisplay({ streak, size = 'lg' }: Props) {
  const flames = Math.min(streak, 7)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end gap-0.5">
        {streak === 0 ? (
          <span className={size === 'lg' ? 'text-5xl' : 'text-2xl'}>🩶</span>
        ) : (
          Array.from({ length: flames }).map((_, i) => (
            <span
              key={i}
              className="transition-all"
              style={{
                fontSize: size === 'lg' ? `${1.5 + i * 0.25}rem` : '1rem',
                opacity: 0.5 + i * (0.5 / flames),
              }}
            >
              🔥
            </span>
          ))
        )}
      </div>
      <p
        className={`font-black tabular-nums ${
          size === 'lg' ? 'text-4xl text-white' : 'text-xl text-white'
        }`}
      >
        {streak}
        <span className="text-gray-500 font-normal text-sm ml-1">
          {streak === 1 ? 'day' : 'days'}
        </span>
      </p>
    </div>
  )
}
