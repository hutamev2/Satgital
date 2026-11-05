import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import type { Listing } from "@/lib/data";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <article className="listing-card">
      <Link href={`/ilanlar/${listing.id}`} className="listing-image-wrap">
        <img className="listing-image" src={listing.image} alt={listing.title} />
        <button className="favorite-button" aria-label={`${listing.title} ilanını favorilere ekle`}><Heart size={19} /></button>
        <span className="condition-badge">{listing.condition}</span>
      </Link>
      <div className="listing-content">
        <p className="listing-category">{listing.category}</p>
        <Link href={`/ilanlar/${listing.id}`}><h3>{listing.title}</h3></Link>
        <strong className="listing-price">{listing.price}</strong>
        <div className="listing-meta"><span><MapPin size={15} /> {listing.location}</span><span>{listing.posted}</span></div>
      </div>
    </article>
  );
}
