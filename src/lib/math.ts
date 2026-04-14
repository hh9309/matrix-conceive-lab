import { create, all } from 'mathjs';

const math = create(all);

export type MatrixData = number[][];

export const identity2D: MatrixData = [
  [1, 0],
  [0, 1],
];

export const identity3D: MatrixData = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

export function multiply(a: MatrixData, b: MatrixData): MatrixData {
  try {
    // Ensure dimensions match for multiplication
    if (a[0].length !== b.length) {
      return a.length === 2 ? identity2D : identity3D;
    }
    const result = math.multiply(a, b) as any;
    return Array.isArray(result) ? result : result.toArray();
  } catch (e) {
    console.error("Matrix multiplication error:", e);
    return a.length === 2 ? identity2D : identity3D;
  }
}

export function determinant(a: MatrixData): number {
  return math.det(a);
}

export function inverse(a: MatrixData): MatrixData | null {
  try {
    const det = determinant(a);
    if (Math.abs(det) < 1e-10) return null;
    const result = math.inv(a) as any;
    return Array.isArray(result) ? result : result.toArray();
  } catch {
    return null;
  }
}

export function getEigenvalues(a: MatrixData): number[] {
  try {
    const result = math.eigs(a);
    const values = result.values as any;
    const arrayValues = Array.isArray(values) ? values : values.toArray();
    return arrayValues.map((v: any) => (typeof v === 'number' ? v : v.re));
  } catch {
    return [];
  }
}

export function getEigenvectors(a: MatrixData): { value: number; vector: number[] }[] {
  try {
    const result = math.eigs(a);
    const values = result.values as any;
    const eigenvectors = result.eigenvectors as any;
    
    const arrayValues = Array.isArray(values) ? values : values.toArray();
    
    return arrayValues.map((val: any, i: number) => ({
      value: typeof val === 'number' ? val : val.re,
      vector: Array.isArray(eigenvectors[i].vector) ? eigenvectors[i].vector : (eigenvectors[i].vector as any).toArray()
    }));
  } catch {
    return [];
  }
}

export function multiplyVector(matrix: MatrixData, vector: number[]): number[] {
  try {
    const cols = matrix[0].length;
    let adjustedVector = [...vector];
    
    if (vector.length < cols) {
      // Pad with zeros
      adjustedVector = [...vector, ...new Array(cols - vector.length).fill(0)];
    } else if (vector.length > cols) {
      // Truncate
      adjustedVector = vector.slice(0, cols);
    }

    const result = math.multiply(matrix, adjustedVector) as any;
    return Array.isArray(result) ? result : result.toArray();
  } catch (e) {
    console.error("Vector multiplication error:", e);
    return new Array(matrix.length).fill(0);
  }
}

export function formatMatrix(a: MatrixData): string {
  return JSON.stringify(a);
}
