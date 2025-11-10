import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  return (
    <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-white px-6">
      <div className="flex-1">
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold text-sm">Amit Jadhav</p>
          <p className="text-xs text-gray-500">Admin</p>
        </div>
        <Avatar>
          {/* You can replace this with a real image URL */}
          <AvatarImage src="https://github.com/shadcn.png" alt="@amit" />
          <AvatarFallback>AJ</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}