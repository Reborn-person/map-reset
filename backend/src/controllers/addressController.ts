import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import Address from '../models/Address';

import redisClient from '../config/redis';
import { geocodeAddress } from '../utils/geocoding';

export const getAddresses = async (req: AuthRequest, res: Response) => {
  try {
    const cacheKey = `addresses:${req.user._id}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      res.json(JSON.parse(cachedData));
      return;
    }

    const addresses = await Address.find({ user_id: req.user._id });
    
    // Set cache with 1 hour expiration
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(addresses));
    
    res.json(addresses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getNearbyAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lng, lat, radius = '3000' } = req.query;

    if (!lng || !lat) {
      res.status(400).json({ message: 'lng and lat are required' });
      return;
    }

    const nearbyAddresses = await Address.find({
      user_id: req.user._id,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: Number(radius)
        }
      }
    });

    res.json(nearbyAddresses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, location, tags, addressText } = req.body;

    let resolvedLocation = location;
    let resolvedDescription = description;

    if ((!resolvedLocation || !resolvedLocation.coordinates) && addressText) {
      const geocoded = await geocodeAddress(addressText);

      if (!geocoded) {
        res.status(400).json({ message: 'Unable to geocode the provided address' });
        return;
      }

      resolvedLocation = {
        type: 'Point',
        coordinates: geocoded.coordinates
      };
      resolvedDescription = description || geocoded.formattedAddress;
    }

    if (!resolvedLocation || !resolvedLocation.coordinates) {
      res.status(400).json({ message: 'Location coordinates or address text is required' });
      return;
    }

    const address = new Address({
      user_id: req.user._id,
      name,
      description: resolvedDescription,
      location: {
        type: 'Point',
        coordinates: resolvedLocation.coordinates
      },
      tags
    });

    const createdAddress = await address.save();
    await redisClient.del(`addresses:${req.user._id}`);
    res.status(201).json(createdAddress);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, location, tags, addressText } = req.body;
    const address = await Address.findById(req.params.id);

    if (!address) {
      res.status(404).json({ message: 'Address not found' });
      return;
    }

    if (address.user_id.toString() !== req.user._id.toString()) {
      res.status(401).json({ message: 'User not authorized' });
      return;
    }

    let resolvedLocation = location;
    let resolvedDescription = description;

    if ((!resolvedLocation || !resolvedLocation.coordinates) && addressText) {
      const geocoded = await geocodeAddress(addressText);

      if (!geocoded) {
        res.status(400).json({ message: 'Unable to geocode the provided address' });
        return;
      }

      resolvedLocation = {
        type: 'Point',
        coordinates: geocoded.coordinates
      };
      resolvedDescription = description || geocoded.formattedAddress;
    }

    address.name = name || address.name;
    address.description = resolvedDescription || address.description;
    address.location = resolvedLocation || address.location;
    address.tags = tags || address.tags;

    const updatedAddress = await address.save();
    await redisClient.del(`addresses:${req.user._id}`);
    res.json(updatedAddress);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      res.status(404).json({ message: 'Address not found' });
      return;
    }

    if (address.user_id.toString() !== req.user._id.toString()) {
      res.status(401).json({ message: 'User not authorized' });
      return;
    }

    await Address.deleteOne({ _id: address._id });
    await redisClient.del(`addresses:${req.user._id}`);
    res.json({ message: 'Address removed' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
