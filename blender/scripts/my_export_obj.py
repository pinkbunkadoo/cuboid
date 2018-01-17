#
# This is a custom OBJ exporter written for Cuboid.
# It includes vertex colour data in the output.
#

bl_info = {
    'name': 'My Export OBJ',
    'category': 'Import-Export'
}

import bpy
import os
import math
import mathutils

class MyExportPanel(bpy.types.Panel):
    bl_label = 'Export OBJ'
    bl_idname = 'OBJECT_PT_hello'
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'TOOLS'
    bl_context = 'objectmode'
    bl_category = 'Export'
    # bl_context = 'scene'

    def draw(self, context):
        layout = self.layout

        obj = bpy.context.active_object

        row = layout.row()
        row.operator('object.simple_operator')


def saveFile(name, mesh):
    text = ''
    filepath = bpy.data.filepath
    directory = os.path.dirname(filepath)
    filename = os.path.join(directory, name + '.obj')

    text = 'o ' + name + '\n'

    text = text + '# Vertices\n'

    for vertex in mesh.vertices:
        text = text + 'v ' + '%.6f' % vertex.co[0] + ' ' + '%.6f' % vertex.co[1] + ' ' + '%.6f' % vertex.co[2]
        text = text + '\n'
        # file_string = file_string + 'v ' + vertex

    #for vertex in mesh.vertices:
    #    text = text + 'v ' + '%.6f' % vertex.co[0] + ' ' + '%.6f' % vertex.co[1] + ' ' + '%.6f' % vertex.co[2]
    #    text = text + '\n'

    color_map = None
    alpha_map = None

    if 'Col' in mesh.vertex_colors:
        color_map = mesh.vertex_colors['Col']
    if 'Alpha' in mesh.vertex_colors:
        alpha_map = mesh.vertex_colors['Alpha']

    colors = []

    text = text + '# Vertex Colors\n'

		# Vertex Colors	- not normally supported by OBJ
    if color_map is not None:
        for mlc in color_map.data:
            s = '%.4f' % mlc.color.r + ' %.4f' % mlc.color.g + ' %.4f' % mlc.color.b
            if s not in colors:
                colors.append(s)
                text = text + 'vc ' + s + '\n'

    # UVs
    uvs = []
    uv_layer = mesh.uv_layers.active
    text = text + '# UVs\n'
    if uv_layer is not None:
        for poly in mesh.polygons:
            for idx in range(poly.loop_start, poly.loop_start + poly.loop_total):
                uv = uv_layer.data[idx].uv
                if uv not in uvs:
                    uvs.append(uv)
                    u = uv[0]
                    v = uv[1]
                    text = text + 'vt ' + '%.6f' % u + ' ' + '%.6f' % v  + '\n'

    # Smoothing groups off
    text = text + 's off\n'

    # Faces
    text = text + '# Polygons\n'
    for poly in mesh.polygons:
        # print('--p:', poly.loop_total)
        text = text + 'f'
        for idx in range(poly.loop_start, poly.loop_start + poly.loop_total):
            vc = None
            if color_map is not None:
                c = color_map.data[idx].color
                s = '%.4f' % c.r + ' %.4f' % c.g + ' %.4f' % c.b

                if s in colors:
                    vc = colors.index(s) + 1

            text = text + ' %d' % (mesh.loops[idx].vertex_index + 1) + '/'

            if uv_layer is not None:
                uv = uv_layer.data[idx].uv
                if uv in uvs:
                    vt = uvs.index(uv)
                    text = text + '%d' % (vt + 1)

            text = text + '/'

            if vc is not None:
                text = text + '/' + '%d' % vc

        text = text + '\n'

    print(name, '->', filename)

    fo = open(filename, 'w')
    fo.write(text)
    fo.close()

    # print(len(color_map.data))

def main(context):
    print('Exporting...')

    obj = context.active_object
    #print(obj.type)
    if obj is not None:
        if obj.type == 'MESH':
            mat_rot = mathutils.Matrix.Rotation(math.radians(-90.0), 4, 'X')
            matrix = obj.matrix_world * mat_rot;
            mod = obj.modifiers.new('Triangulate', type='TRIANGULATE')
            mesh = obj.to_mesh(context.scene, True, 'PREVIEW')
            mesh.transform(matrix);
            saveFile(obj.name, mesh)
            obj.modifiers.remove(mod)

    print('Complete')


class SimpleOperator(bpy.types.Operator):
    '''Tooltip'''
    bl_idname = 'object.simple_operator'
    bl_label = 'Export xOBJ'

    @classmethod
    def poll(cls, context):
        return context.active_object is not None

    def execute(self, context):
        main(context)
        return {'FINISHED'}


def register():
    bpy.utils.register_class(SimpleOperator)
    bpy.utils.register_class(MyExportPanel)

def unregister():
    bpy.utils.unregister_class(SimpleOperator)
    bpy.utils.unregister_class(MyExportPanel)

if __name__ == '__main__':
    register()

    # test call
    bpy.ops.object.simple_operator()
