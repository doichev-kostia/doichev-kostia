import numpy as np
import os
import pandas as pd
from ulid import ULID


def generate_comparison_dataset(num_records, seed=42):
	"""
	Generate a synthetic comparison dataset with random variations.
	"""
	np.random.seed(seed)

	# Generate ULIDs
	ids = [str(ULID()) for _ in range(num_records)]

	# Generate base values with some correlation but also randomness
	base_x = np.random.normal(1000, 200, num_records)
	base_y = np.random.normal(5000, 1000, num_records)

	# Create variations for x1, x2 and y1, y2
	variation_x = np.random.uniform(-50, 50, num_records)
	variation_y = np.random.uniform(-200, 200, num_records)

	data = {
		'id': ids,
		'x1': base_x,
		'x2': base_x + variation_x,
		'y1': base_y,
		'y2': base_y + variation_y,
	}

	df = pd.DataFrame(data)

	# Calculate differences
	df['difference_x'] = df['x2'] - df['x1']
	df['difference_y'] = df['y2'] - df['y1']

	# Round numerical columns to 2 decimal places
	numeric_columns = ['x1', 'x2', 'difference_x', 'y1', 'y2', 'difference_y']
	df[numeric_columns] = df[numeric_columns].round(2)

	return df


def generate_multiple_comparisons():
	"""
	Generate multiple comparison files with specified record counts
	"""
	# Create dataset directory if it doesn't exist
	output_dir = "../dataset"
	os.makedirs(output_dir, exist_ok=True)

	record_counts = [500, 1000, 5000, 10000, 25000]

	for i, count in enumerate(record_counts):
		# Use different seed for each file
		seed = 42 + i

		# Generate the dataset
		df = generate_comparison_dataset(count, seed)

		# Format the filename with the record count
		# Use K for thousands to make filenames cleaner
		count_str = f"{count // 1000}K" if count >= 1000 else str(count)
		filename = os.path.join(output_dir, f'comparison_data_{count_str}.parquet')

		df.to_parquet(filename, index=False)

		print(f"Generated {filename} with {count:,} records")


if __name__ == "__main__":
	generate_multiple_comparisons()
