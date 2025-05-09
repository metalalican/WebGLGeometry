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

// Flere globale variable
var textureGL = 0;
var display = [ 0.0, 0.0, 0.0, 0.0 ];


const l = document.getElementById('l').value;
display[0] = parseInt(l.substring(1,3),16)/255.0;
display[1] = parseInt(l.substring(3,5),16)/255.0;
display[2] = parseInt(l.substring(5,7),16)/255.0;

var displayGL = 0;
document.getElementById('gl').addEventListener
(
    'mousemove', function(e) 
    {
        if (e.buttons == 1)
        {
            // Venstre mussetast bliver trykket
            angle[0] -= (mouseY - e.y) * 0.01;
            angle[1] += (mouseX - e.x) * 0.01;
            gl.uniform4fv(angleGL, new Float32Array(angle));
            Render();
        }
        mouseX = e.x;
        mouseY = e.y;
    }
);

function Update()
{
    //Vis tekstur (boolean) sidste element
    const t = document.getElementById('t');
    display[3] = t.checked ? 1.0 : 0.0;
    
    //Lysfarve (konverter hex til rgb)
    const l = document.getElementById('l').value;
    display[0] = parseInt(l.substring(1,3),16)/255.0;
    display[1] = parseInt(l.substring(3,5),16)/255.0;
    display[2] = parseInt(l.substring(5,7),16)/255.0;

    //Opdater array til grafik kort og render
    gl.uniform4fv(displayGL, new Float32Array(display));
    Render();
}

function CreateTexture(prog, url)
{
    // Load tekstur til grafikkortet
    const texture = LoadTexture(url);
    // Flip y aksen så den passer til OpenGL standarden
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // Aktiver tekstur til tekstur unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Tilføj uniform lokation til fragment shader
    textureGL = gl.getUniformLocation(prog, 'Texture');
    displayGL = gl.getUniformLocation(prog, 'Display');
}

function LoadTexture(url)
{
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const pixel = new Uint8Array([0, 0, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    const image = new Image();
    image.onload = () => 
    {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 
            gl.RGBA, gl.UNSIGNED_BYTE, image);
        SetTextureFilters(image);
    };
    image.src = url;
    return texture;
}

function SetTextureFilters(image)
{
    if (IsPow2(image.width) && IsPow2(image.height))
    {
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    else
    {
        gl.texParameteri(gl.TEXTURE_2D, 
            gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, 
            gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, 
            gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
}

function IsPow2(value)
{
    return (value & (value - 1)) === 0;
}

function AddVertex(x, y, z, r, g, b, u, v, nx, ny, nz)
{
    const index = vertices.length;
    vertices.length += 11;
    vertices[index + 0] = x;
    vertices[index + 1] = y;
    vertices[index + 2] = z;
    vertices[index + 3] = r;
    vertices[index + 4] = g;
    vertices[index + 5] = b;
    vertices[index + 6] = u;
    vertices[index + 7] = v;
    vertices[index + 8] = nx;
    vertices[index + 9] = ny;
    vertices[index + 10] = nz;
}


// Ny funktion til at bygge en trekant
function AddTriangle(x1, y1, z1, r1, g1, b1, u1, v1, nx1, ny1, nz1,
                    x2, y2, z2, r2, g2, b2, u2, v2, nx2, ny2, nz2,
                    x3, y3, z3, r3, g3, b3, u3, v3, nx3, ny3, nz3)
    {
        AddVertex(x1, y1, z1, r1, g1, b1, u1, v1, nx1, ny1, nz1);
        AddVertex(x2, y2, z2, r2, g2, b2, u2, v2, nx2, ny2, nz2);
        AddVertex(x3, y3, z3, r3, g3, b3, u3, v3, nx3, ny3, nz3);
    }
    
// Funktion til at bygge en firkant    
function AddQuad(x1, y1, z1, r1, g1, b1, u1, v1,  nx1, ny1, nz1,
                x2, y2, z2, r2, g2, b2, u2, v2, nx2, ny2, nz2,
                x3, y3, z3, r3, g3, b3, u3, v3, nx3, ny3, nz3,
                x4, y4, z4, r4, g4, b4, u4, v4, nx4, ny4, nz4)
    {
    AddTriangle(x1, y1, z1, r1, g1, b1, u1, v1, nx1, ny1, nz1,
                x2, y2, z2, r2, g2, b2, u2, v2, nx2, ny2, nz2,
                x3, y3, z3, r3, g3, b3, u3, v3, nx3, ny3, nz3)
                
    AddTriangle(x1, y1, z1, r1, g1, b1, u1, v1, nx1, ny1, nz1,
                x3, y3, z3, r3, g3, b3, u3, v3, nx2, ny2, nz2,
                x4, y4, z4, r4, g4, b4, u4, v4, nx4, ny4, nz4)
    }


function AddBox(w, h, d, u, v)
{
 // Forside (rød) – normal (0, 0, 1)
 AddQuad(
    -w, -h,  d, 1, 0, 0, 0, 0, 0, 0, 1,
     w, -h,  d, 1, 0, 0, 1, 0, 0, 0, 1,
     w,  h,  d, 1, 0, 0, 1, 1, 0, 0, 1,
    -w,  h,  d, 1, 0, 0, 0, 1, 0, 0, 1);

// Bagside (grøn) – normal (0, 0, -1)
AddQuad(
     w, -h, -d, 0, 1, 0, 0, 0, 0, 0, -1,
    -w, -h, -d, 0, 1, 0, 1, 0, 0, 0, -1,
    -w,  h, -d, 0, 1, 0, 1, 1, 0, 0, -1,
     w,  h, -d, 0, 1, 0, 0, 1, 0, 0, -1);

// Højre side (blå) – normal (1, 0, 0)
AddQuad(
     w, -h,  d, 0, 0, 1, 0, 0, 1, 0, 0,
     w, -h, -d, 0, 0, 1, 1, 0, 1, 0, 0,
     w,  h, -d, 0, 0, 1, 1, 1, 1, 0, 0,
     w,  h,  d, 0, 0, 1, 0, 1, 1, 0, 0);

// Venstre side (gul) – normal (-1, 0, 0)
AddQuad(
    -w, -h, -d, 1, 1, 0, 0, 0, -1, 0, 0,
    -w, -h,  d, 1, 1, 0, 1, 0, -1, 0, 0,
    -w,  h,  d, 1, 1, 0, 1, 1, -1, 0, 0,
    -w,  h, -d, 1, 1, 0, 0, 1, -1, 0, 0);

// Top (magenta) – normal (0, 1, 0)
AddQuad(
    -w,  h,  d, 1, 0, 1, 0, 0, 0, 1, 0,
     w,  h,  d, 1, 0, 1, 1, 0, 0, 1, 0,
     w,  h, -d, 1, 0, 1, 1, 1, 0, 1, 0,
    -w,  h, -d, 1, 0, 1, 0, 1, 0, 1, 0);

// Bund (cyan) – normal (0, -1, 0)
AddQuad(
    -w, -h, -d, 0, 1, 1, 0, 0, 0, -1, 0,
     w, -h, -d, 0, 1, 1, 1, 0, 0, -1, 0,
     w, -h,  d, 0, 1, 1, 1, 1, 0, -1, 0,
    -w, -h,  d, 0, 1, 1, 0, 1, 0, -1, 0);
}
    

function AddSubBox(width, height, depth, subdivision)
{
    vertices.length = 0;

    const w = width * 0.5;
    const h = height * 0.5;
    const d = depth * 0.5;
    
    const sd = subdivision;
    
    
    for (i = 0; i < subdivision; i++)
    {
        for (j = 0; j < subdivision; j++)
        {
            
            const color = (i + j) % 2 === 0 ? 0.0 : 1.0;

            //Forside
            AddQuad(
                -w + i * (width / subdivision),       -h + (j + 1) * (height / subdivision), d, color, color, color, 0.0, 1.0, 0.0, 0.0, 1.0,
                -w + i * (width / subdivision),       -h + j * (height / subdivision),       d, color, color, color, 0.0, 0.0, 0.0, 0.0, 1.0,
                -w + (i + 1) * (width / subdivision), -h + j * (height / subdivision),       d, color, color, color, 1.0, 0.0, 0.0, 0.0, 1.0,
                -w + (i + 1) * (width / subdivision), -h + (j + 1) * (height / subdivision), d, color, color, color, 1.0, 1.0, 0.0, 0.0, 1.0
            );
            
            //Bagside
            AddQuad(
                -w + (i + 1) * (width / subdivision), -h + (j + 1) * (height / subdivision), -d, color, color, color, 0.0, 1.0, 0.0, 0.0, -1.0,
                -w + (i + 1) * (width / subdivision), -h + j * (height / subdivision),       -d, color, color, color, 0.0, 0.0, 0.0, 0.0, -1.0,
                -w + i * (width / subdivision),       -h + j * (height / subdivision),       -d, color, color, color, 1.0, 0.0, 0.0, 0.0, -1.0,
                -w + i * (width / subdivision),       -h + (j + 1) * (height / subdivision), -d, color, color, color, 1.0, 1.0, 0.0, 0.0, -1.0
            );
            
            //Toppen
            AddQuad(
                -w + (i + 1) * (width / subdivision), h, -d + (j + 1) * (depth / subdivision), color, color, color, 0.0, 1.0, 0.0, 1.0, 0.0,
                -w + (i + 1) * (width / subdivision), h, -d + j * (depth / subdivision),       color, color, color, 0.0, 0.0, 0.0, 1.0, 0.0,
                -w + i * (width / subdivision),       h, -d + j * (depth / subdivision),       color, color, color, 1.0, 0.0, 0.0, 1.0, 0.0,
                -w + i * (width / subdivision),       h, -d + (j + 1) * (depth / subdivision), color, color, color, 1.0, 1.0, 0.0, 1.0, 0.0
            );
            
            //Bunden
            AddQuad(
                -w + i * (width / subdivision), -h, -d + (j + 1) * (depth / subdivision),       color, color, color, 0.0, 1.0, 0.0, -1.0, 0.0,
                -w + i * (width / subdivision), -h, -d + j * (depth / subdivision),             color, color, color, 0.0, 0.0, 0.0, -1.0, 0.0,
                -w + (i + 1) * (width / subdivision), -h, -d + j * (depth / subdivision),       color, color, color, 1.0, 0.0, 0.0, -1.0, 0.0,
                -w + (i + 1) * (width / subdivision), -h, -d + (j + 1) * (depth / subdivision), color, color, color, 1.0, 1.0, 0.0, -1.0, 0.0
            );
            
            //Venstre side
            AddQuad(
                -w, -h + (j + 1) * (height / subdivision), -d + i * (depth / subdivision),       color, color, color, 0.0, 1.0, -1.0, 0.0, 0.0,
                -w, -h + j * (height / subdivision),       -d + i * (depth / subdivision),       color, color, color, 0.0, 0.0, -1.0, 0.0, 0.0,
                -w, -h + j * (height / subdivision),       -d + (i + 1) * (depth / subdivision), color, color, color, 1.0, 0.0, -1.0, 0.0, 0.0,
                -w, -h + (j + 1) * (height / subdivision), -d + (i + 1) * (depth / subdivision), color, color, color, 1.0, 1.0, -1.0, 0.0, 0.0
            );
            
            //Højre side
            AddQuad(
                w, -h + (j + 1) * (height / subdivision), -d + (i + 1) * (depth / subdivision), color, color, color, 0.0, 1.0, 1.0, 0.0, 0.0,
                w, -h + j * (height / subdivision),       -d + (i + 1) * (depth / subdivision), color, color, color, 0.0, 0.0, 1.0, 0.0, 0.0,
                w, -h + j * (height / subdivision),       -d + i * (depth / subdivision),       color, color, color, 1.0, 0.0, 1.0, 0.0, 0.0,
                w, -h + (j + 1) * (height / subdivision), -d + i * (depth / subdivision),       color, color, color, 1.0, 1.0, 1.0, 0.0, 0.0
                
            );
        }
    }
}


// Laver en trekants koordinater baseret på width og height
function CreateTriangle(width, height)
{
    vertices.length = 0;
    const w = width * 0.5;
    const h = height * 0.5;
    
    AddTriangle(0, h, 0.0,    1.0, 0.0, 0.0,   0.5, 1.0,   0.0, 0.0, 1.0,
                -w, -h, 0.0,  0.0, 1.0, 0.0,   0.0, 0.0,   0.0, 0.0, 1.0,
                w, -h, 0.0,   0.0, 0.0, 1.0,   1.0, 0.0,   0.0, 0.0, 1.0);
}

//NOTE TIL SELV HUSK AT LAV NORMALER FOR RESTEN AF FIGURERNE OGSÅ

// Laver en firkants koordinater baseret på width og height
function CreateQuad(width, height)
{
    vertices.length = 0;
    const w = width * 0.5;
    const h = height * 0.5;

    AddQuad(-w, h, 0.0,     1.0, 0.0, 0.0,   0.0, 1.0,   0.0, 0.0, -1.0,
            -w, -h, 0.0,    0.0, 1.0, 0.0,   0.0, 0.0,   0.0, 0.0, -1.0,
            w, -h, 0.0,    0.0, 0.0, 1.0,   1.0, 0.0,   0.0, 0.0, -1.0,
            w, h, 0.0,     1.0, 1.0, 0.0,   1.0, 1.0,   0.0, 0.0, -1.0); 

}

function CreateBox(width, height, depth)
{
    vertices.length = 0;
    const w = width * 0.5;
    const h = height * 0.5;
    const d = depth * 0.5;

    AddBox(w, h, d, 0.0, 1.0);
}

function InitWebGL()
{
    if (!gl)
{
    alert('WebGl is not supported');
    return;
}

let canvas = document.getElementById('gl');
//const texture = LoadTexture(gl, "pictures/1814.jpg");

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
    const ed = document.getElementById('d');
    const d = ed ? ed.value : 1.0;
    const esd = document.getElementById('sd');
    const sd = esd ? esd.value : 1.0;

    document.getElementById('ui').innerHTML =
    'Width: <input type="number" id="w" value="'  + w +  '" onchange= "InitShaders();"><br>' + 
    'Height: <input type="number" id="h" value="' + h +  '" onchange= "InitShaders();"><br>' +
    'Depth: <input type="number" id="d" value="'  + d +  '" onchange= "InitShaders();"><br>' +
    'SubD: <input type="number" id="sd" value="'  + sd + '" onchange= "InitShaders();"><br>';

    let e = document.getElementById('shape');
    switch (e.selectedIndex)
    {
        case 0: CreateTriangle(w, h);
        break;
        case 1: CreateQuad(w, h);
        break;
        case 2: CreateBox(w, h, d);
        break;
        case 3: AddSubBox(w, h, d, sd);                
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
    CreateTexture(program, 'pictures/1812.jpg');

    //Aktiver shader programmet
    gl.useProgram(program);

    //Opdaterer rotationsvisningen
    gl.uniform4fv(angleGL, new Float32Array(angle));

    //Opdaterer display instillinger
    gl.uniform4fv(displayGL,new Float32Array(display));

    //Vis geometrien på skærmen
    Render();    
}

function CreateVBO(program, vert)
{
    let vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vert, gl.STATIC_DRAW);
    
    // 6-tallet definerer hvor mange værdier vi har i vores geometri, en 7. værdi ville give os en alpha-værdi
    const s = 11 * Float32Array.BYTES_PER_ELEMENT;

    // Laver shader attributten: Pos (position)
    let p = gl.getAttribLocation(program, 'Pos');
    gl.vertexAttribPointer(p,3,gl.FLOAT,gl.FALSE,s,0);
    gl.enableVertexAttribArray(p);

    // Laver shader attributten: Color
    const o = 3 * Float32Array.BYTES_PER_ELEMENT; //Laver et offset på 3 til indlæsning af color-værdierne fra matrixen ovenfor
    let c = gl.getAttribLocation(program, 'Color');
    gl.vertexAttribPointer(c,3,gl.FLOAT,gl.FALSE,s,o);
    gl.enableVertexAttribArray(c);

    //Laver shader attributterne: UV
    const o2 = o * 2;
    let u = gl.getAttribLocation(program, 'UV');
    gl.vertexAttribPointer(u, 2, gl.FLOAT, gl.FALSE, s, o2);
    gl.enableVertexAttribArray(u);
}

function Render()
{
    gl.clearColor(0.0, 0.4, 0.6, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length/6);
}