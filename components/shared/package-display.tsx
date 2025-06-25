import { getPackageDisplayType, type BackendPackageType } from '@/lib/utils/package-types'

interface PackageDisplayProps {
    package: {
        id: number
        name: string
        type: BackendPackageType
        startDate: string
        endDate: string
        price: number
    }
}

export function PackageTypeDisplay({ package: pkg }: PackageDisplayProps) {
    const displayType = getPackageDisplayType(
        pkg.type,
        pkg.startDate,
        pkg.endDate,
        pkg.name
    )

    return (
        <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                {displayType}
            </span>
            <span className="text-sm text-gray-600">
                {pkg.name}
            </span>
        </div>
    )
}

// Example usage in a table
export function PackagesTable({ packages }: { packages: any[] }) {
    return (
        <table className="w-full">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Duration</th>
                </tr>
            </thead>
            <tbody>
                {packages.map((pkg) => (
                    <tr key={pkg.id}>
                        <td>{pkg.name}</td>
                        <td>
                            <PackageTypeDisplay package={pkg} />
                        </td>
                        <td>${pkg.price}</td>
                        <td>
                            {new Date(pkg.startDate).toLocaleDateString()} - {new Date(pkg.endDate).toLocaleDateString()}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
} 