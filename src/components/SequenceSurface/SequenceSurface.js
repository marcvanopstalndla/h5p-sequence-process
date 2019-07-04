import React, { Fragment } from 'react';
import md5 from 'md5';
import { SequenceProcessContext } from 'context/SequenceProcessContext';
import { DragDropContext } from 'react-beautiful-dnd';
import Column from 'components/Column/Column';
import StatementList from "components/StatementList/StatementList";

export default class SequenceSurface extends React.Component {

    static contextType = SequenceProcessContext;

    state = {
        statements: [],
        sequencedStatements: [],
        remainingStatements: [],
        showOneColumn: false,
        labels: [],
    };

    constructor(props) {
        super(props);

        this.onDropEnd = this.onDropEnd.bind(this);
    }

    onDropEnd(dragResult) {
        //console.log(dragResult);
        let {
            combine,
            destination,
            source,
            draggableId
        } = dragResult;

        if (!combine && !destination) {
            return;
        }

        if (destination !== null && destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }
        const sequencedStatements = Array.from(this.state.sequencedStatements);
        const remainingStatements = Array.from(this.state.remainingStatements);

        let droppedIndex = null, draggedIndex;
        draggableId = draggableId.replace(/\w+-/, "");
        if (combine !== null) {
            const droppedOnId = combine.draggableId.replace("sequenced-", "");
            droppedIndex = sequencedStatements.indexOf(droppedOnId);
            draggedIndex = sequencedStatements.indexOf(draggableId);
        } else {
            if (source.droppableId === destination.droppableId) {
                sequencedStatements.splice(source.index, 1);
                sequencedStatements.splice(destination.index, 0, draggableId);
            } else {
                droppedIndex = destination.index < sequencedStatements.length ? destination.index : sequencedStatements.length - 1;
                draggedIndex = sequencedStatements.indexOf(draggableId);
            }
        }

        if (droppedIndex !== null) {
            [sequencedStatements[droppedIndex], sequencedStatements[draggedIndex]] = [sequencedStatements[draggedIndex], sequencedStatements[droppedIndex]];
        }

        if (remainingStatements.length > 0 && source.droppableId !== 'processed') {
            remainingStatements.splice(source.index, 1);
        }

        const draggedStatement = Object.assign({}, this.state.statements[draggableId]);
        draggedStatement.isPlaceholder = false; //destination === 'processed';

        this.setState({
            statements: {
                ...this.state.statements,
                [draggableId]: draggedStatement
            },
            sequencedStatements: sequencedStatements,
            remainingStatements: remainingStatements,
            showOneColumn: remainingStatements.length === 0,
        });
    }

    componentDidMount() {
        const {
            params: {
                statementsList,
                labelsList,
            }
        } = this.context;

        const statements = statementsList.reduce((existing, current) => {
            const id = md5(current);
            existing[id] = {
                id: id,
                statement: current,
                isPlaceholder: true,
            };
            return existing;
        }, {});

        console.log(statements);

        this.setState({
            statements: statements,
            remainingStatements: Object.keys(statements),
            sequencedStatements: Object.keys(statements),
            labels: labelsList.map(label => {
                return {
                    id: md5(label),
                    label,
                };
            }),
        });
    }

    handleSurface() {
        if (this.state.showOneColumn !== true) {
            return (
                <Fragment>
                    <Column
                        droppableId={"processed"}
                        combine={true}
                        columnType="sequenced"
                    >
                        {this.state.sequencedStatements
                            .map(statementId => this.state.statements[statementId])
                            .map((statement, index) => (
                                <StatementList
                                    key={"sequenced-" + statement.id}
                                    draggableType="sequenced"
                                    statement={statement}
                                    index={index}
                                />
                            ))
                        }
                    </Column>
                    <Column
                        droppableId="start"
                        disableDrop={true}
                        columnType="remaining"
                    >
                        {this.state.remainingStatements
                            .map(statementId => this.state.statements[statementId])
                            .map((statement, index) => (
                                <StatementList
                                    key={"remaining-" + statement.id}
                                    draggableType="remaining"
                                    statement={statement}
                                    index={index}
                                />
                            ))
                        }
                    </Column>
                </Fragment>
            );
        } else {
            return (
                <Fragment>
                    <Column
                        droppableId={"processed"}
                        columnType="sequenced"
                    >
                        {this.state.sequencedStatements
                            .map(statementId => this.state.statements[statementId])
                            .map((statement, index) => (
                                <StatementList
                                    key={"sequenced-" + statement.id}
                                    draggableType="sequenced"
                                    statement={statement}
                                    index={index}
                                    isSingleColumn={true}
                                    labels={this.state.labels}
                                />
                            ))
                        }
                    </Column>
                </Fragment>
            );
        }
    }

    render() {
        return (
            <div
                className="h5p-sequenceSurface"
            >
                <DragDropContext
                    className="h5p-sequenceSurface"
                    onDragEnd={this.onDropEnd}
                >
                    {this.handleSurface()}
                </DragDropContext>
            </div>
        );
    }
}