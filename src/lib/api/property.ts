import apiEndpoints from '../apiEndpoints';
import api from '../axios';

export const getPropertyById = async (propertyId: number) => {
  try {
    const response = await api.get(apiEndpoints.Property.endpoints.getPropertyById.path.replace("{id}", propertyId.toString()));
    return response;
  } catch (error) {
    throw error;
  }
}; 