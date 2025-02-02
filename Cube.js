class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0]; // Default color
        this.matrix = new Matrix4();
        this.buffer = null;
        this.vertices = null;
    }

    generateVertices() {
        if (this.vertices === null) {
            this.vertices = [
                // Front Face
                [0,0,0, 1,1,0, 1,0,0],
                [0,0,0, 0,1,0, 1,1,0],

                // Top Face
                [0,1,0, 1,1,-1, 1,1,0],
                [0,1,0, 0,1,-1, 1,1,-1],

                // Left Face
                [0,0,0, 0,1,0, 0,0,-1],
                [0,0,-1, 0,1,0, 0,1,-1],

                // Right Face
                [1,0,0, 1,1,0, 1,0,-1],
                [1,0,-1, 1,1,0, 1,1,-1],

                // Back Face
                [0,0,-1, 1,1,-1, 1,0,-1],
                [0,0,-1, 0,1,-1, 1,1,-1],

                // Bottom Face
                [0,0,0, 1,0,-1, 1,0,0],
                [0,0,0, 0,0,-1, 1,0,-1]
            ];
        }
    }

    setupBuffer() {
        // Create and reuse buffer
        if (this.buffer === null) {
            this.buffer = gl.createBuffer();
            if (!this.buffer) {
                console.log("Failed to create the buffer object");
                return;
            }
        }
    }

    render() {
        var rgba = this.color;

        // Pass the matrix to the shader
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        this.generateVertices();
        this.setupBuffer();

        // Shading levels
        const shading = [1.0, 0.8, 0.6];
        const faceColors = [
            [rgba[0] * shading[0], rgba[1] * shading[0], rgba[2] * shading[0], rgba[3]], // Brightest
            [rgba[0] * shading[1], rgba[1] * shading[1], rgba[2] * shading[1], rgba[3]], // Medium
            [rgba[0] * shading[2], rgba[1] * shading[2], rgba[2] * shading[2], rgba[3]]  // Darkest
        ];

        // Front        
        gl.uniform4f(u_FragColor, ...faceColors[2]); // Front Face -Technically considered back due to weird shading
        drawTriangle3D(this.vertices[0], this.buffer);
        drawTriangle3D(this.vertices[1], this.buffer);

        // Top
        drawTriangle3D(this.vertices[2], this.buffer);
        drawTriangle3D(this.vertices[3], this.buffer);

        // Left
        gl.uniform4f(u_FragColor, ...faceColors[1]);
        drawTriangle3D(this.vertices[4], this.buffer);
        drawTriangle3D(this.vertices[5], this.buffer);

        // Right
        drawTriangle3D(this.vertices[6], this.buffer);
        drawTriangle3D(this.vertices[7], this.buffer);  
        
        // Back
        gl.uniform4f(u_FragColor, ...faceColors[0]);
        drawTriangle3D(this.vertices[8], this.buffer);
        drawTriangle3D(this.vertices[9], this.buffer);

        // Bottom
        drawTriangle3D(this.vertices[10], this.buffer);
        drawTriangle3D(this.vertices[11], this.buffer);  
    }
}