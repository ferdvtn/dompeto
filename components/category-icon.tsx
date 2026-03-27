import * as LucideIcons from "lucide-react"
import { LucideProps } from "lucide-react"

interface IconProps extends LucideProps {
	name: string
}

export const CategoryIcon = ({ name, ...props }: IconProps) => {
	// @ts-ignore
	const IconComponent = LucideIcons[name]

	if (IconComponent) {
		return <IconComponent {...props} />
	}

	// Fallback to emoji or default icon if not a valid Lucide name
	return (
		<span className="text-xl leading-none">{name.length <= 2 ? name : "📂"}</span>
	)
}
