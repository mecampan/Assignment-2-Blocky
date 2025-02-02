class Tetrahedron {
    constructor() {
        this.type = 'tertrahedron';
        this.color = [1.0, 1.0, 1.0, 1.0]; // Default color
        this.matrix = new Matrix4();
        this.buffer = null;
        this.vertices = null;
    }

    generateVertices() {
        var height = Math.sqrt(2) / Math.sqrt(3);
        var back = -Math.sqrt(3)/2;
        if (this.vertices === null) {
            this.vertices = [
                // Base
                [0, 0, 0,  1, 0, 0,  0.5, 0, back], 
    
                // Front
                [0, 0, 0,  0.5, height, -1/3,  1, 0, 0],
    
                // Left
                [0, 0, 0,  0.5, 0, back,  0.5, height, -1/3],
    
                // Right
                [0.5, 0, back,  1, 0, 0,  0.5, height, -1/3]
            ];
        }
    }

    render() {
        var rgba = this.color;

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        this.generateVertices();

        if (this.buffer === null) {
            this.buffer = gl.createBuffer();
            if (!this.buffer) {
                console.log("Failed to create the buffer object");
                return;
            }
        }

        // Shading levels
        const shading = [1.0, 0.8, 0.6];
        const faceColors = [
            [rgba[0] * shading[0], rgba[1] * shading[0], rgba[2] * shading[0], rgba[3]],
            [rgba[0] * shading[1], rgba[1] * shading[1], rgba[2] * shading[1], rgba[3]],
            [rgba[0] * shading[2], rgba[1] * shading[2], rgba[2] * shading[2], rgba[3]]
        ];

        // Draw each face with different shading levels
        gl.uniform4f(u_FragColor, ...faceColors[2]);
        drawTriangle3D(this.vertices[0], this.buffer); // Base

        gl.uniform4f(u_FragColor, ...faceColors[0]); // Front
        drawTriangle3D(this.vertices[1], this.buffer);

        gl.uniform4f(u_FragColor, ...faceColors[1]);
        drawTriangle3D(this.vertices[2], this.buffer); // Left and Right
        drawTriangle3D(this.vertices[3], this.buffer);
    }
}