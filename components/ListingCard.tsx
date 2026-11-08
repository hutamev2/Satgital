import Link from "next/link";
import {FavoriteButton} from "./FavoriteButton";
import { MapPin } from "lucide-react";
import type { Listing } from "@/lib/data";

export function ListingCard({ listing }: { listing: Listing }) {
  const href = listing.href ?? `/ilanlar/${listing.id}`;
  return (
    <article className="listing-card">
      <div className="listing-image-wrap"><Link href={href}>
        <img className="listing-image" src={listing.image} alt={listing.title} />
        </Link>{listing.href && <FavoriteButton id={listing.id}/>}
        <span className="condition-badge">{listing.condition}</span>
      </div>
      <div className="listing-content">
        <p className="listing-category">{listing.category}</p>
        <Link href={href}><h3>{listing.title}</h3></Link>
        <strong className="listing-price">{listing.price}</strong>
        <div className="listing-meta"><span><MapPin size={15} /> {listing.location}</span><span>{listing.posted}</span></div>
      </div>
    </article>
  );
}
