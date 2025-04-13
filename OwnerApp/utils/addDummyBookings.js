// OwnerApp/utils/addDummyBookings.js
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc, arrayUnion, query, where } from 'firebase/firestore';

// Function to generate a random confirmation code
const generateConfirmationCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Sample renter names
const renterNames = [
  'John Smith',
  'Emily Johnson',
  'Michael Brown',
  'Sarah Davis',
  'David Wilson',
  'Jessica Martinez'
];

// Sample renter emails
const renterEmails = [
  'john@renter.com',
  'emily@renter.com',
  'michael@renter.com',
  'sarah@renter.com',
  'david@renter.com',
  'jessica@renter.com'
];

// Function to add dummy bookings to a car listing
export const addDummyBookingToListing = async (listingId) => {
  try {
    // Get reference to the listing document
    const listingRef = doc(db, 'carListings', listingId);
    
    // Generate random renter index
    const renterIndex = Math.floor(Math.random() * renterNames.length);
    
    // Create a dummy booking
    const dummyBooking = {
      id: Date.now().toString(), // Use timestamp as ID
      renterName: renterNames[renterIndex],
      renterEmail: renterEmails[renterIndex],
      renterUid: `dummy-renter-${renterIndex}`, // Dummy UID
      confirmationCode: generateConfirmationCode(),
      bookingDate: new Date(),
      status: 'confirmed'
    };
    
    // Add the booking to the listing's bookings array
    await updateDoc(listingRef, {
      bookings: arrayUnion(dummyBooking)
    });
    
    return dummyBooking;
  } catch (error) {
    console.error('Error adding dummy booking:', error);
    throw error;
  }
};

// Function to add dummy bookings to all listings for a specific owner
export const addDummyBookingsForOwner = async (ownerUid) => {
  try {
    // Query listings for this owner
    const q = query(collection(db, 'carListings'), where('ownerId', '==', ownerUid));
    const querySnapshot = await getDocs(q);
    
    const results = [];
    
    // For each listing, add 1-3 dummy bookings
    for (const docSnapshot of querySnapshot.docs) {
      const numBookings = Math.floor(Math.random() * 3) + 1; // 1 to 3 bookings
      
      for (let i = 0; i < numBookings; i++) {
        const booking = await addDummyBookingToListing(docSnapshot.id);
        results.push({
          listingId: docSnapshot.id,
          booking
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error adding dummy bookings for owner:', error);
    throw error;
  }
};
