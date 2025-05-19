const apiEndpoints = {
    "Property": {
      description: "Property operations",
      endpoints: {
        getAllProperties: {
          method: "GET",
          path: "/web/property",
          description: "Get all properties",
        },
        createProperty: {
          method: "POST",
          path: "/api/v1/property",
          description: "Create a new property",
        },
        getPropertyById: {
          method: "GET",
          path: "/web/property/{id}",
          description: "Get a property by ID",
        },
        updateProperty: {
          method: "PUT",
          path: "/api/v1/property/{id}",
          description: "Update a property",
        },
        deleteProperty: {
          method: "DELETE",
          path: "/api/v1/property/{id}",
          description: "Delete a property",
        },
      },
    },
  
    "Property Image": {
      description: "Property Images operations",
      endpoints: {
        getAllPropertyImages: {
          method: "GET",
          path: "/api/v1/property-image",
          description: "Get all property images",
        },
        uploadPropertyImage: {
          method: "POST",
          path: "/api/v1/property-image",
          description: "Upload a new property image",
        },
        getPropertyImageById: {
          method: "GET",
          path: "/api/v1/property-image/{id}",
          description: "Get property image by ID",
        },
        updatePropertyImage: {
          method: "PUT",
          path: "/api/v1/property-image/{id}",
          description: "Update a property image",
        },
        deletePropertyImage: {
          method: "DELETE",
          path: "/api/v1/property-image/{id}",
          description: "Delete a property image",
        },
      },
    },
  
    "Unit": {
      description: "Unit (Flat) operations",
      endpoints: {
        getAllUnits: {
          method: "GET",
          path: "/api/v1/unit",
          description: "Get all units",
        },
        createUnit: {
          method: "POST",
          path: "/api/v1/unit",
          description: "Create a new unit",
        },
        getUnitById: {
          method: "GET",
          path: "/api/v1/unit/{id}",
          description: "Get a unit by ID",
        },
        updateUnit: {
          method: "PUT",
          path: "/api/v1/unit/{id}",
          description: "Update a unit",
        },
        deleteUnit: {
          method: "DELETE",
          path: "/api/v1/unit/{id}",
          description: "Delete a unit",
        },
      },
    },
  
    "Auth": {
      description: "Authentication operations for web users",
      endpoints: {
        register: {
          method: "POST",
          path: "/web/auth/register",
          description: "Register a new user",
        },
        login: {
          method: "POST",
          path: "/web/auth/login",
          description: "Login an existing user",
        },
        recoverPassword: {
          method: "POST",
          path: "/web/auth/recover-pass",
          description: "Recover an existing user password",
        },
        changePassword: {
          method: "POST",
          path: "/web/user",
          description: "change an existing user first time password",
        },
      },
    },

    "User": {
        description: "operations for users",
        endpoints: {
          getAllUsers: {
            method: "GET",
            path: "/web/user",
            description: "Get all users",
          }
        },
    },
  };
  
  export default apiEndpoints;
  