def cluster_x_coordinates(boxes):
    # Extract all min_x values
    x_vals = [b['min_x'] for b in boxes]
    if not x_vals: return []
    
    # Simple 1D KMeans
    # Initialize with 4 evenly spaced centers
    min_x, max_x = min(x_vals), max(x_vals)
    centers = [min_x, min_x + (max_x-min_x)*0.33, min_x + (max_x-min_x)*0.66, max_x]
    
    for _ in range(10):
        # Assign to nearest center
        clusters = {0:[], 1:[], 2:[], 3:[]}
        for x in x_vals:
            distances = [abs(x - c) for c in centers]
            closest = distances.index(min(distances))
            clusters[closest].append(x)
            
        # Update centers
        new_centers = []
        for i in range(4):
            if clusters[i]:
                new_centers.append(sum(clusters[i])/len(clusters[i]))
            else:
                new_centers.append(centers[i])
        centers = new_centers
        
    centers.sort()
    return centers

# Example test
boxes = [
    {"min_x": 10}, {"min_x": 12}, {"min_x": 15}, # Col 1
    {"min_x": 100}, {"min_x": 105}, {"min_x": 110}, # Col 2
    {"min_x": 200}, {"min_x": 205}, {"min_x": 210}, # Col 3
    {"min_x": 300}, {"min_x": 305}, {"min_x": 310}, # Col 4
]
centers = cluster_x_coordinates(boxes)
print("Centers:", centers)
bounds = [(centers[i] + centers[i+1])/2 for i in range(3)]
print("Bounds:", bounds)
