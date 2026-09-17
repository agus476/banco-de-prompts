"use client";

import { Star } from "lucide-react";
import { toggleFavorite } from "@/actions/prompts";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";

export function FavoriteButton({
  id,
  favorite,
}: {
  id: string;
  favorite: boolean;
}) {
  return (
    <form
      action={toggleFavorite.bind(null, id)}
      onClick={(event) => event.stopPropagation()}
    >
      <IconButton
        type="submit"
        aria-label={favorite ? "Quitar de favoritos" : "Marcar como favorito"}
        aria-pressed={favorite}
        className={favorite ? "text-[#e8c36a] hover:text-[#f0d08a]" : ""}
      >
        <Star className={cn("h-4 w-4", favorite && "fill-current")} />
      </IconButton>
    </form>
  );
}
