import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import Address from '../models/Address';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

import redisClient from '../config/redis';
import { geocodeAddress } from '../utils/geocoding';

export const importAddressesCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const parsedRows: any[] = [];
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    bufferStream
      .pipe(csvParser())
      .on('data', (data) => {
        parsedRows.push(data);
      })
      .on('end', async () => {
        try {
          const results: any[] = [];

          for (const row of parsedRows) {
            const tags = row.tags ? row.tags.split(';').map((t: string) => t.trim()) : [];

            if (row.name && row.lat && row.lng) {
              results.push({
                user_id: req.user._id,
                name: row.name,
                description: row.description || '',
                location: {
                  type: 'Point',
                  coordinates: [parseFloat(row.lng), parseFloat(row.lat)]
                },
                tags
              });
              continue;
            }

            if (row.name && row.address) {
              const geocoded = await geocodeAddress(row.address);

              if (!geocoded) {
                continue;
              }

              results.push({
                user_id: req.user._id,
                name: row.name,
                description: row.description || geocoded.formattedAddress,
                location: {
                  type: 'Point',
                  coordinates: geocoded.coordinates
                },
                tags
              });
            }
          }

          if (results.length > 0) {
            await Address.insertMany(results);
            await redisClient.del(`addresses:${req.user._id}`);
            res.status(201).json({
              message: `Successfully imported ${results.length} addresses`,
              imported: results.length,
              totalRows: parsedRows.length
            });
          } else {
            res.status(400).json({ message: 'No valid data found in CSV' });
          }
        } catch (dbError: any) {
          res.status(500).json({ message: 'Database error during import', error: dbError.message });
        }
      });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const exportAddressesCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const addresses = await Address.find({ user_id: req.user._id });
    
    let csv = 'name,description,lat,lng,tags\n';
    
    addresses.forEach(addr => {
      const coordinates = addr.location?.coordinates || [0, 0];
      const name = `"${(addr.name || '').replace(/"/g, '""')}"`;
      const description = `"${(addr.description || '').replace(/"/g, '""')}"`;
      const lat = coordinates[1];
      const lng = coordinates[0];
      const tags = `"${(addr.tags || []).join(';')}"`;
      
      csv += `${name},${description},${lat},${lng},${tags}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=addresses.csv');
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const exportAddressesGeoJSON = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const addresses = await Address.find({ user_id: req.user._id });

    const geoJson = {
      type: 'FeatureCollection',
      features: addresses.map((addr) => ({
        type: 'Feature',
        geometry: addr.location,
        properties: {
          id: addr._id,
          name: addr.name,
          description: addr.description,
          tags: addr.tags,
          createdAt: addr.createdAt
        }
      }))
    };

    res.setHeader('Content-Type', 'application/geo+json');
    res.setHeader('Content-Disposition', 'attachment; filename=addresses.geojson');
    res.status(200).json(geoJson);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
