class Pyramid {
    constructor() {
        this.type = 'pyramid';
        this.color = [1.0, 1.0, 1.0, 1.0]; // Default color
        this.matrix = new Matrix4();
        this.buffer = null;
        this.vertices = null;
    }

    generateVertices() {
        if (this.vertices === null) {
            this.vertices = [
                // Front Face
                [0,0,0,  0.5,0.5,-0.5,  1,0,0],

                // Left Face
                [0,0,0,  0,0,-1,  0.5,0.5,-0.5],

                // Right Face
                [1,0,0,  1,0,-1,  0.5,0.5,-0.5],

                // Back Face
                [0,0,-1,  1,0,-1,  0.5,0.5,-0.5],

                // Bottom Face
                [0,0,0,  1,0,-1,  1,0,0],
                [0,0,0,  0,0,-1,  1,0,-1]
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
        gl.uniform4f(u_FragColor, ...faceColors[0]); // Front -Technically considered back due to weird shading
        drawTriangle3D(this.vertices[3], this.buffer);

        gl.uniform4f(u_FragColor, ...faceColors[1]); // Left and Right
        drawTriangle3D(this.vertices[1], this.buffer);
        drawTriangle3D(this.vertices[2], this.buffer);

        gl.uniform4f(u_FragColor, ...faceColors[2]); // Back and Bottom - Back technically considered front due to weird shading
        drawTriangle3D(this.vertices[0], this.buffer);

        drawTriangle3D(this.vertices[4], this.buffer);
        drawTriangle3D(this.vertices[5], this.buffer);
    }
}