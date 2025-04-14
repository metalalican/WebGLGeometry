// Globale variable
var vertices = [];
var gl = document.getElementById('gl')
.getContext('webgl') ||
//^ sørger for understøttelse af IE, Edge og Safari
document.getElementById('gl')
.getContext('experimental-webgl');

var mouseX = 0, mouseY = 0;
var angle = [0.0, 0.0, 0.0, 1.0];
var angleGL = 0;

document.getElementById('gl').addEventListener
(
    'mousemove', function(e) 
    {
        if (e.buttons == 1)
        {
            // Venstre mussetast bliver trykket
            angle[0] -= (mouseY - e.y) * 0.1;
            angle[1] += (mouseY - e.x) * 0.1;
            gl.uniform4fv(angleGL, new Float32Array(angle));
            Render();
        }
        mouseX = e.x;
        mouseY = e.y;
    }
);


function AddVertex(x, y, z, r, g, b)
{
    const index = vertices.length;
    vertices.length += 6;
    vertices[index + 0] = x;
    vertices[index + 1] = y;
    vertices[index + 2] = z;
    vertices[index + 3] = r;
    vertices[index + 4] = g;
    vertices[index + 5] = b;
}

// Laver en trekants koordinater baseret på width og height
function CreateTriangle(width, height)
{
    vertices.length = 0;
    const w = width * 0.5;
    const h = height * 0.5;
    AddTriangle(0.0, h, 0.0, 1.0, 0.0, 0.0,
                -w, -h, 0.0, 0.0, 1.0, 0.0,
                w, -h, 0.0, 0.0, 0.0, 1.0);
}

// Laver en firkants koordinater baseret på width og height
function CreateQuad(width, height)
{
    vertices.length = 0;
    const w = width * 0.5;
    const h = height * 0.5;
    AddQuad(-w, h, 0.0, 1.0, 0.0, 0.0,
                -w, -h, 0.0, 0.0, 1.0, 0.0,
                w, -h, 0.0, 0.0, 0.0, 1.0,
                w, h, 0.0, 1.0, 1.0, 0.0);
}

// Ny funktion til at bygge en trekant
function AddTriangle(x1, y1, z1, r1, g1, b1,
                    x2, y2, z2, r2, g2, b2,
                    x3, y3, z3, r3, g3, b3)
{
    AddVertex(x1, y1, z1, r1, g1, b1);
    AddVertex(x2, y2, z2, r2, g2, b2);
    AddVertex(x3, y3, z3, r3, g3, b3);
}

// Benytter den nye funktion til trekanter for at bygge en firkant
// ved at bygge to trekanter
function AddQuad(x1, y1, z1, r1, g1, b1,
                x2, y2, z2, r2, g2, b2,
                x3, y3, z3, r3, g3, b3,
                x4, y4, z4, r4, g4, b4)
{
    AddTriangle(x1, y1, z1, r1, g1, b1,
                x2, y2, z2, r2, g2, b2,
                x3, y3, z3, r3, g3, b3)

    AddTriangle(x3, y3, z3, r3, g3, b3,
                x4, y4, z4, r4, g4, b4,
                x1, y1, z1, r1, g1, b1)
}


function InitWebGL()
{
    if (!gl)
    {
        alert('WebGl is not supported');
        return;
    }
    
    let canvas = document.getElementById('gl');
    
    if (canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight)
    {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    InitViewport(canvas);
}

function InitViewport()
{
    gl.viewport(0, //Forskydning fra venstre side (x)
                0, //Forskydning fra bunden (y)
                gl.canvas.width, //Bredde
                gl.canvas.height //Højde
                )

    gl.clearColor(0.0, 0.4, 0.6, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    InitShaders();
}

function InitShaders()
{
    //Kompiler vertex og fragment shadere
    const vs = InitVertexShader();
    const fs = InitFragmentShader();

    //Linker to shadere i et shader program
    let program = InitShaderProgram(vs, fs);

    if (!ValidateShaderProgram(program))
    {
        return false;
    }

    //Laver GPU buffer for geometrien
    return CreateGeometryBuffers(program);

}

function InitVertexShader()
{
    let e = document.getElementById('vs');
    let vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, e.value);
    gl.compileShader(vs);

    //Error håndtering
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
    {
        let e = gl.getShaderInfoLog(vs);
        console.error('Failed init vertex shader: ', e);
        return;
    }
    return vs;
}

function InitFragmentShader()
{
    let e = document.getElementById('fs');
    let fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, e.value);
    gl.compileShader(fs);

    //Error håndtering
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
    {
        let e = gl.getShaderInfoLog(fs);
        console.error('Failed init vertex shader: ', e);
        return;
    }
    return fs;
}

//Funktionen som linker to shaders sammen
function InitShaderProgram(vs, fs)
{
    
    let p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);

    //Error håndtering
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    {
        console.error(gl.getProgramInfoLog(p));
        alert('Failed linking program');
        return;
    }
    return p;
}

function ValidateShaderProgram(p)
{
    gl.validateProgram(p);

    //Error håndtering
    if (!gl.getProgramParameter(p, gl.VALIDATE_STATUS))
    {
        console.error(gl.getProgramInfoLog(p));
        alert('Errors found validating shader program');
        return false;
    }
    return true;
}

function CreateGeometryUI()
{
    const ew = document.getElementById('w');
    const w = ew ? ew.value : 1.0;
    const eh = document.getElementById('h');
    const h = eh ? eh.value : 1.0;
    document.getElementById('ui').innerHTML =
    'Width: <input type="number" id="w" value="'+ w +
    '"onchange= "InitShaders();"><br>' + 
    'Height: <input type="number" id="h" value="' + h +
    '"onchange= "Initshaders();">';
        let e = document.getElementById('shape');
        switch (e.selectedIndex)
        {
            case 0: CreateTriangle(w, h);
            break;
            case 1: CreateQuad(w, h);
            break;
        }
}

function CreateGeometryBuffers(program)
{
    //Kalder vores geometriUI funktion
    CreateGeometryUI();
    
    //GPU buffer
    CreateVBO(program, new Float32Array(vertices));

    angleGL = gl.getUniformLocation(program, 'Angle');

    //Aktiver shader programmet
    gl.useProgram(program);

    //Vis geometrien på skærmen
    Render();    
}

function CreateVBO(program, vert)
{
    let vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER,vert,gl.STATIC_DRAW);
    // 6-tallet definerer hvor mange værdier vi har i vores geometri, en 7. værdi ville give os en alpha-værdi
    const s = 6 * Float32Array.BYTES_PER_ELEMENT;
    // Laver shader attributten: Pos (position)
    let p = gl.getAttribLocation(program, 'Pos');
    gl.vertexAttribPointer(p,3,gl.FLOAT,gl.FALSE,s,0);
    gl.enableVertexAttribArray(p);
    // Laver shader attributten: Color
    const o = 3 * Float32Array.BYTES_PER_ELEMENT; //Laver et offset på 3 til indlæsning af color-værdierne fra matrixen ovenfor
    let c = gl.getAttribLocation(program, 'Color');
    gl.vertexAttribPointer(c,3,gl.FLOAT,gl.FALSE,s,o);
    gl.enableVertexAttribArray(c);
}

function Render()
{
    gl.clearColor(0.0, 0.4, 0.6, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length/6);
}