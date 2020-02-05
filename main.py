import os

from . import nodeLib


class nodeViz:
    # doing: single source cluster
    # TODO: make it work with multiple source clusters
    def __init__(self):
        self.source_cluster = nodeLib.cluster.create_cluster('src_cluster')
        self.viz_cluster = nodeLib.cluster.create_cluster('viz_cluster')
        self.relations = {
            'properties of': nodeLib.cluster.create_relation(
                self.viz_cluster,
                'properties of')
        }
        super().__init__()

    def get_new_location(self, curr_node=None):
        if len(self.viz_cluster.nodes.values()) == 0:
            return (0, 0, 0)
        else:
            # get a new location

            if curr_node == None:
                # option 1: get a new location anywhere close to existing nodes
                # todo: query: get 'location' data from all nodes in custer
                locations = []
                for node_ in self.viz_cluster.nodes.values():
                    locations.append(node_.data['location'])
                # todo: find max and min x,y and z
                maxs = (0, 0, 0)
                mins = (0, 0, 0)
                for loc in locations:
                    for i in range(3):
                        if loc[i] > maxs[i]:
                            maxs[i] = loc[i]
                        if loc[i] < mins[i]:
                            mins[i] = loc[i]
                # todo: from min to max exclude occupied locations and generate list of empty spots
                empties = [[], [], []]
                """
                [2, -5,7,8,15] -> [-4,-3,-2,-1,0,1,3,4,5,6,9,10,11,12,13,14]
                                  [ 0, 1, 2,3,4,5,6,7,8,9,10,11,12,13,14,15]
                max-min-occupied location list length
                """
                return (0, 0, 0)
                pass
            else:
                # option 2: get a new location close a perticular node
                pass

    def create_node(self, node_label='__node__', location=None):

        # get a new location
        node_ = nodeLib.node.create_node({'node_label': node_label})
        self.source_cluster.nodes[node_.node_ID.ID] = node_

        properties = nodeLib.node.create_node(
            {'node_label': '__props__'},
            data={
                'location': self.get_new_location() if location == None else location,
                'color': (0, 255, 0),
                'size': 1,
                'selected': False
            }
        )
        self.viz_cluster.nodes[properties.node_ID.ID] = properties

        nodeLib.node.claim_relation(
            properties, node_, self.relations['properties of'], direction='from_self')
        return node_.node_ID.ID

        # create another
    def update_node_data(self, node_ID: str, data={}):
        for node_ in self.source_cluster.nodes.values():
            if node_.node_ID.ID == node_ID:
                node_.data.update(data)

    def change_property(self, node_ID, prop, value):

        # doing: query: find which node in viz_cluster has a relation to node with node_ID
        viz_node_ID = None
        for node_ in self.viz_cluster.nodes.values():
            for relation_claim in node_.relation_claims:
                if relation_claim.to_node.node_ID.ID == node_ID:
                    # todo: not finding viz_nod_ID
                    viz_node_ID = node_.node_ID.ID
                    break

        # doing: change property of the viz_node
        self.viz_cluster.nodes[viz_node_ID].data[prop] = value

    def load_database(self, path, database_name):
        self.source_cluster = nodeLib.files.load_cluster(
            path, database_name, 'src_cluster')
        self.viz_cluster = nodeLib.files.load_cluster(
            path, database_name, 'viz_cluster')
        self.relations['properties of'] = self.viz_cluster.relations[list(
            self.viz_cluster.relations.keys())[0]]

    def save_database(self, path, database_name):
        nodeLib.files.write_cluster(
            self.source_cluster, path, database_name)
        nodeLib.files.write_cluster(
            self.viz_cluster, path, database_name)

    def clear_database(self, mode='all'):
        nodeLib.cluster.clear_cluster(self.source_cluster)
        nodeLib.cluster.clear_cluster(self.viz_cluster)


"""viz_instance1 = nodeViz()
nodes_ = {
    'nodeLib': viz_instance1.create_node('nodeLib'),
    'graph query': viz_instance1.create_node('graph query'),
    'graph data structure': viz_instance1.create_node('graph data structure')
}
viz_instance1.update_node_data(
    nodes_['nodeLib'], {"test": "a", "haha": "b", "lol": "c"})

path = os.path.join(os.getcwd(), 'data')
nodeLib.files.write_cluster(viz_instance1.source_cluster, path, 'viz_database')
nodeLib.files.write_cluster(viz_instance1.viz_cluster, path, 'viz_database')
nodeLib.cluster.describe(viz_instance1.source_cluster)
nodeLib.cluster.describe(viz_instance1.viz_cluster)"""
