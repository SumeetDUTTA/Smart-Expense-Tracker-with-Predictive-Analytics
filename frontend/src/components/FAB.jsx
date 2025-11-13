import React from "react";

export default function FAB({ onClick, title = 'Add', icon = null }) {
	return (
		<button
			onClick={onClick}
			aria-label={title}
			className="fixed right-6 bottom-6 z-50 w-14 h-14 rounded-full shadow-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
			title={title}
		>
			{icon || (
				<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
				</svg>
			)}
		</button>
	)
}