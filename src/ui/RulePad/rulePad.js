/**
 * Created by saharmehrpour on 2/23/18.
 */

import React, {Component, Fragment} from "react";
import {connect} from "react-redux";
import "../../App.css";
import {
    Alert, MenuItem, Button, FormGroup, ButtonToolbar, Label, FormControl,
    Modal, Dropdown, Tabs, Tab, Badge,
} from "react-bootstrap";
import {RootCloseWrapper} from "react-overlays";
import {MdEdit, MdAddBox} from "react-icons/md";
import {TiDelete, TiArrowMaximise, TiPinOutline} from "react-icons/ti";
import {GoAlert, GoPin} from "react-icons/go";
import {FaTag, FaMinusCircle, FaTimesCircle, FaCheckSquare, FaQuestionCircle} from "react-icons/fa";

import {marked} from "marked";
import ReactToolTip from "react-tooltip";

import GraphicalEditor from "../RulePad/rulePadGraphicalEditor/graphicalEditor";
import verifyTextBasedOnGrammar from "../../core/languageProcessing";
import {
    matchMessages, receiveGuiTree, clearNewRuleForm,
    editRuleForm, submitNewRule, submitNewTag, updateRule, updateXPaths, ignoreFileChange,
} from "../../actions";
import {generateGuiTrees} from "./rulePadTextualEditor/generateGuiTree";
import TextualEditor from "../RulePad/rulePadTextualEditor/textualEditor";
import Utilities from "../../core/utilities";
import {error_messages_IMarkdownString} from "./rulePadTextualEditor/textualEditorConstant";

import {checkRulesForAll} from "../../core/ruleExecutor";
import ProjectHierarchy from "./projectHierarchy";
import {webSocketSendMessage} from "../../core/coreConstants";
import {reduxStoreMessages} from "../../reduxStoreConstants";
import {constantRuleIndex} from "../uiConstants";
import TourGuide from "./tourGuide";
import tourGuide from "./tourGuide";

class RulePad extends Component {
    constructor(props) {
        super(props);

        this.ruleIndex = props["ruleIndex"] !== undefined ? props["ruleIndex"] : constantRuleIndex.newRuleIndex;
        this.ruleI = null;
        this.newRuleRequest = this.ruleIndex === constantRuleIndex.newRuleIndex;

        if (!props["changeEditMode"]) {
            console.error("'changeEditMode' is required in props when creating/editing a rule.");
        }

        // used as enum
        this.stepNames = {
            TITLE_DESCRIPTION: 0,
            GUI_QUANTIFIER: 4,
            GUI_CONSTRAINT: 5,
            GUI_STAR: 6,
            TEXT_UI: 7,
            TAGS: 10,
            FILE_FOLDER: 11,
        };

        this.state = {
            // rule states
            title: props.title,
            description: props.description,
            ruleTags: props.ruleTags,
            folderConstraint: props.folderConstraint ? props.folderConstraint : "INCLUDE",
            filesFolders: props.filesFolders,
            tags: props.tags,
            projectHierarchy: props.projectHierarchy,

            // new tag states
            showNewTagModal: false,
            tagName: "",
            tagDetail: "",

            // error message
            showError: false,
            errorTitle: "",
            errorMessage: "",

            // GUI error message
            guiError: true,
            isFilledGUI: false,

            pinnedDynamicGuide: false,

            // snippet feedback
            activeTab: 0,
            xPathQueryResult: [],
            shouldUpdateSnippets: false,

            // styling for Monaco Editor
            monacoFormStatus: "has-error",
            errorPoint: -1,

            // tour guide states
            tourMainKey: 0,
            tourStepIndex: 0,
            tourShouldRun: props["displayEditRuleTutorial"],
            isTourGuide: true,

            // editor states
            quantifierXPath: "",
            constraintXPath: "",
            editorError: "",
            showAlert: true,
            autoCompleteArray: [],
        };

        this.shouldUpdate = true;

        // existing rule
        if (this.ruleIndex >= 0) {
            const indices = props.rules.map((d) => d.index);
            const arrayIndex = indices.indexOf(this.ruleIndex);
            if (arrayIndex === -1) {
                console.log(`error: rule with index ${this.ruleIndex} is not found in the ruleTable.
                Only ${indices.toString()} are found as indices.`);
            } else {
                this.ruleI = props.rules[arrayIndex];
                this.state.title = this.ruleI.rulePanelState.title;
                this.state.description = this.ruleI.rulePanelState.description;
                this.state.ruleTags = this.ruleI.rulePanelState.ruleTags;
                this.state.folderConstraint = this.ruleI.rulePanelState.folderConstraint ? this.ruleI.rulePanelState.folderConstraint : "INCLUDE";
                this.state.filesFolders = this.ruleI.rulePanelState.filesFolders;
                this.state.tags = props.tags;
                // updating the rule
                this.state.quantifierXPath = this.ruleI.rulePanelState.quantifierXPath;
                this.state.constraintXPath = this.ruleI.rulePanelState.constraintXPath;
                this.state.autoCompleteArray = this.ruleI.rulePanelState.autoCompleteArray;

                this.state.monacoFormStatus = "has-success";
            }
        } else if (this.ruleIndex === constantRuleIndex.newRuleIndex) { // new rule
            this.state.title = props.title;
            this.state.description = props.description;
            this.state.ruleTags = props.ruleTags;
            this.state.folderConstraint = props.folderConstraint ? props.folderConstraint : "INCLUDE";
            this.state.filesFolders = props.filesFolders;
            this.state.tags = props.tags;

            this.state.quantifierXPath = props.quantifierXPath;
            this.state.constraintXPath = props.constraintXPath;
            this.state.autoCompleteArray = props.autoCompleteArray;
        }
    }

    render() {
        return (
            <div className={"rulePanelDiv" + (this.ruleIndex < 0 ? " edit-bg" : "")}>
                <Fragment>
                    <div style={{float: "right"}}>
                        <FaQuestionCircle size={20} className={"faQuestionCircle react-icons"}
                            onClick={() => this.setState({
                                tourStepIndex: 0,
                                tourGuide: 0,
                                tourShouldRun: true,
                                isTourGuide: true,
                            })}
                        />
                        <MdEdit size={20} className={"mdEdit react-icons"}
                            onClick={() => this.changeEditMode()} />
                    </div>
                    {this.renderTitleAndDescription()}
                    {this.renderTags()}
                </Fragment>
                {this.renderFileConstraints()}
                {this.renderTutorial()}
                {this.renderGUI()}
                {this.renderTextUI()}
                {this.renderFeedbackSnippet()}

                <Fragment>
                    <ButtonToolbar className={"submitButtons"}>
                        <Button bsStyle="primary"
                            onClick={() => this.newRuleRequest ? this.onSubmitNewRule() : this.onSubmitUpdatedRule()}>
                            Submit</Button>
                        <Button bsStyle="default" onClick={() => this.changeEditMode()}>Cancel</Button>
                        {!this.newRuleRequest ? null :
                            <Button bsStyle="default"
                                onClick={() => {
                                    this.setState({
                                        activeTab: 0,
                                        xPathQueryResult: [],
                                        shouldUpdateSnippets: false,
                                    }, this.props.onClearForm);
                                }}>Clear Form</Button>}
                    </ButtonToolbar>

                    {this.renderNewTagModalDialog()}
                    {this.renderErrorInSubmission()}
                </Fragment>
                {/* TODO: Remove unncessary props */}
                <TourGuide tourMainKey={this.state.tourMainKey} tourStepIndex={this.state.tourStepIndex}
                    tourShouldRun={this.state.tourShouldRun} isTourGuide={this.state.isTourGuide} />
            </div>
        );
    }

    /**
     * render the textareas for title and description
     */
    renderTitleAndDescription() {
        return (
            <div id={`title_description_div_${this.ruleIndex}`}>
                <FormGroup validationState={(this.state.title === "") ? "error" : "success"}>
                    <FormControl componentClass="textarea" placeholder="Rule title. (Required)"
                        style={{fontWeight: "bold", resize: "vertical"}}
                        value={this.state.title}
                        onChange={(e) => {
                            this.setState({title: e.target.value});
                        }}
                        onKeyUp={(e) => {
                            e.target.style.cssText = "height:0";
                            e.target.style.cssText = `overflow:hidden;height: ${e.target.scrollHeight} px`;
                        }}
                        onBlur={() => this.onEditNewRuleForm()} />
                </FormGroup>
                <FormGroup validationState={(this.state.description === "") ? "error" : "success"}>
                    <FormControl componentClass="textarea"
                        style={{resize: "vertical"}}
                        placeholder="Description, high level details about the rule. (Required)"
                        value={this.state.description}
                        onChange={(e) => {
                            this.setState({description: e.target.value});
                        }}
                        onKeyUp={(e) => {
                            e.target.style.cssText = "height:0";
                            e.target.style.cssText = `overflow:hidden;height: ${e.target.scrollHeight} px`;
                        }}
                        onBlur={() => this.onEditNewRuleForm()} />
                </FormGroup>
            </div>
        );
    }


    /**
     * render tag badges
     */
    renderTags() {
        return (
            <div style={{paddingTop: "10px", clear: "both"}} id={`tag_div_${this.ruleIndex}`}>
                {this.state.ruleTags.map((d, i) => {
                    return (
                        <div className={"tagLabel"} key={i}>
                            <Label style={{paddingRight: "1px"}}>{d}
                                <TiDelete size={23}
                                    className={"tiDelete react-icons"}
                                    onClick={() => {
                                        const tags = this.state.ruleTags;
                                        tags.splice(i, 1);
                                        this.setState({tags}, this.onEditNewRuleForm);
                                    }} />
                            </Label>
                        </div>);
                })}
                <CustomDropDown
                    menuItems={this.props.tags.map((d) => d.tagName).filter((d) => this.state.ruleTags.indexOf(d) === -1).concat(["New Tag"])}
                    onSelectFunction={(evt) => {
                        if (evt === "New Tag") {
                            this.setState({showNewTagModal: true});
                        } else {
                            const tags = this.state.ruleTags;
                            tags.push(evt);
                            this.setState({tags}, this.onEditNewRuleForm);
                        }
                    }} />
            </div>
        );
    }


    /**
     * render the drop down for the file/folder constraint
     */
    renderFileConstraints() {
        return (
            <div id={`file_constraint_div_${this.ruleIndex}`} style={{margin: "10px 0 10px 0"}}>
                {this.state.filesFolders.map((d, i) => {
                    return (
                        <div key={i} style={{backgroundColor: "#fff"}}>
                            <div style={{display: "inline-block", paddingRight: "15px"}}>
                                <TiDelete size={25}
                                    className={"tiDelete react-icons"}
                                    onClick={() => {
                                        const filesFolders = this.state.filesFolders;
                                        filesFolders.splice(i, 1);
                                        const xPathQueryResult = this.updateFeedbackSnippet(this.state.quantifierXPath, this.state.constraintXPath,
                                            this.state.folderConstraint, filesFolders);
                                        this.setState({filesFolders, xPathQueryResult}, this.onEditNewRuleForm);
                                    }} />
                            </div>
                            <div style={{display: "inline-block", verticalAlign: "middle", color: "#3c763d"}}>
                                {this.state.filesFolders[i]}
                            </div>
                        </div>
                    );
                })}
                {Object.entries(this.state.projectHierarchy).length !== 0 ? (
                    <div className={"projectHierarchy" + (this.state.folderConstraint === "INCLUDE" && this.state.filesFolders.length === 0 ? " has-error" : "")}>
                        <ProjectHierarchy projectHierarchy={this.state.projectHierarchy}
                            onSubmit={(newPath) => {
                                const filesFolders = this.state.filesFolders;
                                filesFolders.push(newPath);
                                const xPathQueryResult = this.updateFeedbackSnippet(this.state.quantifierXPath, this.state.constraintXPath,
                                    this.state.folderConstraint, filesFolders);
                                this.setState({filesFolders, xPathQueryResult}, this.onEditNewRuleForm);
                            }} />
                    </div>
                ) : (
                    <div style={{color: "#a94442"}}>
                        <GoAlert size={25} className={"react-icons"} />
                        <strong>{"The plugin is not connected to the IDE."}</strong>
                    </div>
                )}
            </div>
        );
    }


    /**
     * render the turorial steps above the text editor
     * @returns {JSX.Element}
     */
    renderTutorial() {
        const stepOneStatus = !this.state.isFilledGUI ? "has-error" : "";
        const stepTwoStatus = !this.state.isFilledGUI ? "has-error" : this.state.guiError ? "has-error" : "";
        const stepThreeStatus = !this.state.isFilledGUI || this.state.guiError ? "inactive" : "";

        return (
            <div className={"tutorial" + (this.state.pinnedDynamicGuide ? "" : " sticky")}>
                <div className={"tutorialArrow " + stepOneStatus}>&#x25B6;</div>
                <div className={"tutorialText " + stepOneStatus}>
                    <strong>Step 1:</strong> Write the code you want to match in code using the Graphical Editor.
                    <FaQuestionCircle size={20} className={"faQuestionCircle react-icons"}
                        onClick={() => this.setState({
                            tourShouldRun: true,
                            isTourGuide: false,
                            tourStepIndex: this.stepNames.GUI_QUANTIFIER,
                        })} />
                </div>
                <div className={"tutorialArrow " + stepTwoStatus}>&#x25B6;</div>
                <div className={"tutorialText " + stepTwoStatus}>
                    <strong>Step 2:</strong> Specify what must be true by switching the conditions to
                    'constraints' by clicking on checkboxes
                    <div className={"switchContainer checkboxConstraint constraint"}>
                        <FaCheckSquare size={20} className={"react-icons"} />
                    </div>
                    . Constraint elements are highlighted in the Graphical Editor.
                    <FaQuestionCircle size={20} className={"faQuestionCircle react-icons"}
                        onClick={() => this.setState({
                            tourShouldRun: true,
                            isTourGuide: false,
                            tourStepIndex: this.stepNames.GUI_CONSTRAINT,
                        })} />
                </div>
                <div className={"tutorialArrow " + stepThreeStatus}>&#x25B6;</div>
                <div className={"tutorialText " + stepThreeStatus}>
                    <strong>Step 3: [Optional]</strong> Edit the rule text by adding parentheses and changing
                    and' to 'or'.
                    <FaQuestionCircle size={20} className={"faQuestionCircle react-icons"}
                        onClick={() => this.setState({
                            tourShouldRun: true,
                            isTourGuide: false,
                            tourStepIndex: this.stepNames.TEXT_UI,
                        })} />
                </div>
                <div style={{float: "right"}}>
                    {this.state.pinnedDynamicGuide ?
                        <GoPin className={"tutorialPin react-icons"} size={20}
                            onClick={() => this.setState({pinnedDynamicGuide: false})} /> :
                        <TiPinOutline className={"tutorialPin react-icons"} size={20}
                            onClick={() => this.setState({pinnedDynamicGuide: true})} />
                    }
                </div>
            </div>
        );
    }

    /**
     * render Text UI
     */
    renderTextUI() {
        return (
            <div style={{paddingTop: "10px", clear: "both"}} id={`text_ui_div_${this.ruleIndex}`}>
                <TextualEditor autoCompleteArray={this.state.autoCompleteArray}
                    ruleIndex={this.ruleIndex}
                    errorPoint={this.state.errorPoint}
                    formStatus={this.state.monacoFormStatus}
                    onBlur={(newAutoCompleteText) => {
                        verifyTextBasedOnGrammar(newAutoCompleteText)
                            .then((data) => {
                                if (this._mounted) {
                                    this.setState({
                                        monacoFormStatus: "has-success",
                                        errorPoint: -1,
                                        autoCompleteArray: data.wordArray,
                                        quantifierXPath: data.quantifierXPath,
                                        constraintXPath: data.constraintXPath,
                                        editorError: "",
                                    });
                                }

                                // compute and dispatch gui tree for quantifier and constraint
                                generateGuiTrees(data.grammarTree)
                                    .then((tree) =>
                                        this.props.onReceiveGuiTree(this.ruleIndex, tree, data.wordArray,
                                            data.quantifierXPath, data.constraintXPath));
                            })
                            .catch((error) => {
                                this.processLanguageProcessingError(error);
                                this.setState({
                                    autoCompleteArray: newAutoCompleteText.split(" ").map((d) => {
                                        return {id: "", text: d};
                                    }),
                                    monacoFormStatus: "has-error",
                                });
                            });
                    }}
                    onUpdate={(newAutoCompleteText) => {
                        if (this.shouldUpdate) {
                            this.shouldUpdate = false;
                            verifyTextBasedOnGrammar(newAutoCompleteText)
                                .then((data) => {
                                    if (this.state.quantifierXPath !== data.quantifierXPath ||
                                        this.state.constraintXPath !== data.constraintXPath) {
                                        if (this._mounted) {
                                            this.setState({
                                                quantifierXPath: data.quantifierXPath,
                                                constraintXPath: data.constraintXPath,
                                                shouldUpdateSnippets: false,
                                                editorError: "",
                                            });
                                        }

                                        this.props.onUpdateXPaths(this.ruleIndex, data.quantifierXPath, data.constraintXPath);
                                    }
                                })
                                .catch((error) => {
                                    this.processLanguageProcessingError(error);
                                    this.setState({
                                        autoCompleteArray: newAutoCompleteText.split(" ").map((d) => {
                                            return {id: "", text: d};
                                        }),
                                        monacoFormStatus: "has-error",
                                        shouldUpdateSnippets: false,
                                    });
                                });
                        } else if (this.state.shouldUpdateSnippets) {
                            this.setState({
                                shouldUpdateSnippets: false,
                                editorError: "",
                            });
                        }
                    }}
                    onError={(errorIndex) => this.processLanguageProcessingError("ERROR_INDEX", errorIndex)}
                />
                {this.renderAutoCompleteError()}
            </div>
        );
    }

    /**
     * render GUI
     */
    renderGUI() {
        return (
            <div id={`gui_div_${this.ruleIndex}`}>
                <div className={"generateRuleGuiDiv" + (this.state.guiError ? " has-error" : "")}>
                    <GraphicalEditor ruleIndex={this.ruleIndex} className={"generateRuleGui"}
                        onError={(error) => error !== this.state.guiError ? this.setState({guiError: error}) : {}}
                        onFilledGUI={(isFilled) => isFilled !== this.state.isFilledGUI ?
                            this.setState({isFilledGUI: isFilled}) : {}} />
                </div>
            </div>
        );
    }

    /**
     * render AutoComplete Alert for displaying errors
     * @return {JSX.Element}
     */
    renderAutoCompleteError() {
        if (this.state.editorError !== "") console.log(this.state.editorError);
        if (this.state.editorError === "" || this.state.editorError.message === "") {
            return null;
        }
        return (
            <Fragment>
                {!this.state.showAlert ? null : (
                    <Alert bsStyle={this.state.editorError.alertType}>
                        <div>
                            <div className={"controlButtonDiv"}>
                                <div className={"controlButton"}>
                                    <div data-tip={"React-tooltip"} data-for={"minimize"}>
                                        <FaMinusCircle size={20} className={"react-icons"}
                                            onClick={() => this.setState({showAlert: false})} />
                                    </div>
                                    <ReactToolTip place={"top"} type={"dark"} effect={"solid"} id={"minimize"}
                                        delayShow={300}>
                                        <span>Minimize the error message.</span>
                                    </ReactToolTip>
                                </div>
                                <div className={"controlButton"}>
                                    <div data-tip={"React-tooltip"} data-for={"close"}>
                                        <FaTimesCircle size={20} className={"react-icons"}
                                            onClick={() => this.setState({editorError: ""})} />
                                    </div>
                                    <ReactToolTip place={"top"} type={"dark"} effect={"solid"} id={"close"}
                                        delayShow={300}>
                                        <span>Close the error message.</span>
                                    </ReactToolTip>
                                </div>
                            </div>
                            <div>
                                {/* <h4>{this.state.editorError.errorType}</h4>*/}
                                <h6 dangerouslySetInnerHTML={{__html: marked(this.state.editorError.message)}} />
                                <h6 style={{fontWeight: "bold"}}>{this.state.editorError.inputText}</h6>
                            </div>
                        </div>
                    </Alert>

                )}
                {this.state.showAlert ? null : (
                    <Alert bsStyle={this.state.editorError.alertType}>
                        <div className={"controlButtonDiv controlButton"}>
                            <div data-tip={"React-tooltip"} data-for={"maximize"}>
                                <TiArrowMaximise size={20} className={"react-icons"}
                                    onClick={() => this.setState({showAlert: true})} />
                            </div>
                            <ReactToolTip place={"top"} type={"dark"} effect={"solid"} id={"maximize"} delayShow={300}>
                                <span>Expand the error message.</span>
                            </ReactToolTip>
                        </div>
                    </Alert>
                )}
            </Fragment>
        );
    }

    /**
     * render the dialog for adding a new tag
     * it is displayed when the 'New Tag' is clicked on
     * @returns {JSX.Element}
     */
    renderNewTagModalDialog() {
        return (
            <Modal show={this.state.showNewTagModal} onHide={() => this.setState({showNewTagModal: false})}
                backdrop={"static"} keyboard={true}>
                <Modal.Header closeButton>
                    <Modal.Title>New Tag</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <FormGroup validationState={(this.state.tagName === "") ? "error" : "success"}>
                        <FormControl type="text" placeholder="Tag name. (Required)"
                            style={{fontWeight: "bold"}}
                            value={this.state.tagName}
                            onChange={(e) => {
                                this.setState({tagName: e.target.value});
                            }}
                            onKeyUp={(e) => {
                                e.target.style.cssText = "height:auto; padding:0";
                                e.target.style.cssText = `height: ${this.scrollHeight} px`;
                            }} />
                    </FormGroup>
                    <FormGroup validationState={(this.state.tagDetail === "") ? "error" : "success"}>
                        <FormControl componentClass="textarea"
                            placeholder="Description, high level details about the tag. (Required)"
                            value={this.state.tagDetail}
                            onChange={(e) => {
                                this.setState({tagDetail: e.target.value});
                            }}
                            onKeyUp={(e) => {
                                e.target.style.cssText = "height:auto; padding:0";
                                e.target.style.cssText = `height: ${this.scrollHeight} px`;
                            }} />
                    </FormGroup>
                </Modal.Body>
                <Modal.Footer>
                    <Button bsStyle="primary" onClick={() => this.onSubmitNewTag()}>Save</Button>
                    <Button onClick={() => this.setState({showNewTagModal: false})}>Cancel</Button>
                </Modal.Footer>
            </Modal>
        );
    }


    /**
     * render the modal for printing messages when errors appear for submission
     * @return {JSX.Element}
     */
    renderErrorInSubmission() {
        return (
            <Modal show={this.state.showError} onHide={() => this.setState({showError: false})}
                backdrop={"static"} keyboard={true}>
                <Modal.Header closeButton>
                    <Modal.Title>{this.state.errorTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {this.state.errorMessage}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => this.setState({showError: false})}>OK</Button>
                </Modal.Footer>
            </Modal>
        );
    }


    renderFeedbackSnippet() {
        return (
            <div style={{paddingTop: "10px", clear: "both"}} id={`feedback_snippet_div_${this.ruleIndex}`}>
                <Tabs animation={true} id={"edit_rule_000"}
                    activeKey={this.state.activeTab}
                    onSelect={(key) => {
                        if (this.state.activeTab === key) {
                            this.setState({activeTab: 0});
                        } else {
                            this.setState({activeTab: key});
                        }
                    }}>
                    <Tab eventKey={0} disabled />
                    <Tab eventKey={"satisfied"}
                        title={this.renderTabHeader("satisfied")}>{this.renderListOfSnippets("satisfied")}</Tab>
                    <Tab eventKey={"violated"}
                        title={this.renderTabHeader("violated")}>{this.renderListOfSnippets("violated")}</Tab>
                </Tabs>
            </div>
        );
    }

    /**
     * render the tab headers
     * @param group
     */
    renderTabHeader(group) {
        // sum up the number of satisfied and violated
        let totalSatisfied = 0; let totalViolated = 0;
        for (let i = 0; i < this.state.xPathQueryResult.length; i++) {
            totalSatisfied += this.state.xPathQueryResult[i]["data"]["satisfied"];
            totalViolated += this.state.xPathQueryResult[i]["data"]["violated"];
        }

        switch (group) {
            case "all":
                return (
                    <span className="rulePanelGeneralTab">Matches
                        <Badge className="forAll">{totalSatisfied + totalViolated}</Badge>
                        <Badge className="forFile hidden">{ }</Badge>
                    </span>);
            case "satisfied":
                return (
                    <span className="rulePanelSatisfiedTab">Examples
                        <Badge className="forAll">{totalSatisfied}</Badge>
                        <Badge className="forFile hidden">{ }</Badge>
                    </span>);
            case "violated":
                return (
                    <span className="rulePanelViolatedTab">Violated
                        <Badge className="forAll">{totalViolated}</Badge>
                        <Badge className="forFile hidden">{ }</Badge>
                    </span>);
            default:
                break;
        }
    }

    /**
     * create a list div node for quantifier and satisfied result and wrap them in a div
     * @param group
     * @returns {JSX.Element}
     */
    renderListOfSnippets(group) {
        let filesList = [];
        const res = group === "satisfied" ? "satisfiedResult" : group === "violated" ? "violatedResult" : "quantifierResult";
        for (let i = 0; i < this.state.xPathQueryResult.length; i++) {
            filesList = filesList.concat(this.state.xPathQueryResult[i]["data"][res]);
        }

        if (filesList.length === 0) {
            return (<div><h5>No snippet</h5></div>);
        }

        return (
            <div>
                {filesList.map((d, i) => {
                    return (
                        <div data-file-path={d["filePath"]} className="snippetDiv" key={i}>
                            <pre className="link" onClick={() => {
                                this.props.onIgnoreFile(true);
                                Utilities.sendToServer(this.props.ws, webSocketSendMessage.snippet_xml_msg, d["xml"]);
                            }}>
                                <div className="content" dangerouslySetInnerHTML={{__html: d["snippet"]}} />
                            </pre>
                        </div>
                    );
                })}
            </div>);
    }


    // componentDidUpdate doesn't work
    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.message === reduxStoreMessages.send_expr_stmt_xml_msg) return;
        if (nextProps.message === reduxStoreMessages.change_gui_element_msg) return;

        if (nextProps.message === reduxStoreMessages.receive_expr_stmt_xml_msg) {
            this.matchSentAndReceivedMessages(nextProps);
            this.updateFeedbackSnippet(this.state.quantifierXPath, this.state.constraintXPath,
                this.state.folderConstraint, this.state.filesFolders);
        } else if (nextProps.message === reduxStoreMessages.hierarchy_data_msg) {
            this.setState({projectHierarchy: nextProps.projectHierarchy});
        } else if (nextProps.message === reduxStoreMessages.update_tag_table_msg) {
            this.setState({tags: nextProps.tags});
        } else {
            this.ruleIndex = nextProps.ruleIndex;
            // existing rule
            if (this.ruleIndex >= 0) {
                const indices = nextProps.rules.map((d) => d.index);
                const arrayIndex = indices.indexOf(this.ruleIndex);
                if (arrayIndex === -1) {
                    console.log(`error: rule with index ${this.ruleIndex} is not found in the ruleTable.
                Only ${indices.toString()} are found as indices.`);
                } else {
                    this.ruleI = nextProps.rules[arrayIndex];
                }


                const xPathQueryResult = this.updateFeedbackSnippet(this.ruleI.rulePanelState.quantifierXPath, this.ruleI.rulePanelState.constraintXPath,
                    this.ruleI.rulePanelState.folderConstraint, this.ruleI.rulePanelState.filesFolders);
                this.setState({
                    title: this.ruleI.rulePanelState.title,
                    description: this.ruleI.rulePanelState.description,
                    ruleTags: this.ruleI.rulePanelState.ruleTags,
                    folderConstraint: this.ruleI.rulePanelState.folderConstraint ? this.ruleI.rulePanelState.folderConstraint : "INCLUDE",
                    filesFolders: this.ruleI.rulePanelState.filesFolders,
                    tags: this.ruleI.rulePanelState.tags,

                    autoCompleteArray: this.ruleI.rulePanelState.autoCompleteArray,
                    quantifierXPath: this.ruleI.rulePanelState.quantifierXPath,
                    constraintXPath: this.ruleI.rulePanelState.constraintXPath,
                    editorError: nextProps.message === "CLEAR_NEW_RULE_FORM" ? "" : this.state.editorError,

                    monacoFormStatus: nextProps.message === "CLEAR_NEW_RULE_FORM" ?
                        "has-error" : nextProps.message === "CHANGE_AUTOCOMPLETE_TEXT_FROM_GUI" ?
                            "has-warning" : this.state.monacoFormStatus,
                    errorPoint: -1,

                    shouldUpdateSnippets: nextProps.message === "CHANGE_AUTOCOMPLETE_TEXT_FROM_GUI" ?
                        true : this.state.shouldUpdateSnippets,
                    xPathQueryResult,
                });
            } else if (this.ruleIndex === constantRuleIndex.newRuleIndex) { // new rule
                const xPathQueryResult = this.updateFeedbackSnippet(nextProps.quantifierXPath, nextProps.constraintXPath,
                    nextProps.folderConstraint ? nextProps.folderConstraint : "INCLUDE", nextProps.filesFolders);

                this.setState({
                    title: nextProps.title,
                    description: nextProps.description,
                    ruleTags: nextProps.ruleTags,
                    folderConstraint: nextProps.folderConstraint ? nextProps.folderConstraint : "INCLUDE",
                    filesFolders: nextProps.filesFolders,
                    tags: nextProps.tags,

                    autoCompleteArray: nextProps.autoCompleteArray,
                    quantifierXPath: nextProps.quantifierXPath,
                    constraintXPath: nextProps.constraintXPath,
                    editorError: nextProps.message === "CLEAR_NEW_RULE_FORM" ? "" : this.state.editorError,

                    monacoFormStatus: nextProps.message === "CLEAR_NEW_RULE_FORM" ?
                        "has-error" : nextProps.message === "CHANGE_AUTOCOMPLETE_TEXT_FROM_GUI" ?
                            "has-warning" : this.state.monacoFormStatus,
                    errorPoint: -1,

                    shouldUpdateSnippets: "CHANGE_AUTOCOMPLETE_TEXT_FROM_GUI" ? true : this.state.shouldUpdateSnippets,
                    xPathQueryResult,
                });
            }
        }
    }

    // _mounted is added to remove the warning caused by setting states
    // in Promise.then() function in onBlur
    componentDidMount() {
        this._mounted = true;

        if (this.state.autoCompleteArray.length !== 0) {
            verifyTextBasedOnGrammar(this.state.autoCompleteArray.map((d) => d.text).join(" "))
                .then((data) => {
                    this.setState({
                        monacoFormStatus: "has-success",
                        errorPoint: -1,
                        autoCompleteArray: data.wordArray,
                        editorError: "",
                        xPathQueryResult: this.ruleI.xPathQueryResult,
                    });

                    // compute and dispatch gui tree for quantifier and constraint
                    generateGuiTrees(data.grammarTree)
                        .then((tree) => this.props.onReceiveGuiTree(this.ruleIndex, tree, data.wordArray,
                            this.state.quantifierXPath, this.state.constraintXPath));
                })
                .catch((error) => {
                    this.processLanguageProcessingError(error);
                    this.setState({monacoFormStatus: "has-error"});
                });
        }
    }

    componentWillUnmount() {
        this._mounted = false;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.autoCompleteArray.map((d) => d.text).join(" ") !==
            this.state.autoCompleteArray.map((d) => d.text).join(" ")) {
            this.shouldUpdate = true;
        }
    }


    /**
     * Match nextProps.sentMessages and nextProps.receivedMessages using messageIDs, update XPaths
     * and send actions to update store
     */
    matchSentAndReceivedMessages(nextProps) {
        const sentMessages = nextProps.sentMessages.map((a) => ({...a})); // clone
        const receivedMessages = nextProps.receivedMessages.map((a) => ({...a})); // clone
        let quantifierXPath = this.state.quantifierXPath.slice(0);
        let constraintXPath = this.state.constraintXPath.slice(0);

        sentMessages.sort((a, b) => a["messageID"] - b["messageID"]);
        receivedMessages.forEach((a) => a["messageID"] = +a["messageID"]);
        receivedMessages.sort((a, b) => a["messageID"] - b["messageID"]);

        const matchedIndices = {sent: [], received: []};

        let otherIndex = 0;
        for (let index = 0; index < sentMessages.length; index++) {
            if (otherIndex >= receivedMessages.length) break;
            for (let j = otherIndex; j < receivedMessages.length; j++) {
                // matched messages
                if (+sentMessages[index]["messageID"] === +receivedMessages[j]["messageID"]) {
                    const resultXPath = "[" +
                        this.traverseReceivedXml(receivedMessages[j]["xmlText"], sentMessages[index]) + "]";
                    // replace all occurrences of textAndXPath.originalText

                    while (quantifierXPath.indexOf(sentMessages[j]["lookFor"]) !== -1) {
                        quantifierXPath = quantifierXPath.replace(sentMessages[j]["lookFor"], resultXPath);
                    }
                    while (constraintXPath.indexOf(sentMessages[j]["lookFor"]) !== -1) {
                        constraintXPath = constraintXPath.replace(sentMessages[j]["lookFor"], resultXPath);
                    }

                    matchedIndices.sent.push(index);
                    matchedIndices.received.push(j);

                    otherIndex = j + 1;
                    break;
                }
            }
        }
        // remove matched messages from list of messages
        for (let i = matchedIndices.sent.length - 1; i >= 0; i--) {
            sentMessages.splice(matchedIndices.sent[i], 1);
        }
        for (let i = matchedIndices.received.length - 1; i >= 0; i--) {
            receivedMessages.splice(matchedIndices.received[i], 1);
        }

        // at least one message is responded
        if (matchedIndices.sent.length > 0) {
            while (quantifierXPath.indexOf("[]") !== -1) {
                quantifierXPath = quantifierXPath.replace("[]", "");
            }
            while (quantifierXPath.indexOf("][") !== -1) {
                quantifierXPath = quantifierXPath.replace("][", " and ");
            }
            while (constraintXPath.indexOf("[]") !== -1) {
                constraintXPath = constraintXPath.replace("[]", "");
            }
            while (constraintXPath.indexOf("][") !== -1) {
                constraintXPath = constraintXPath.replace("][", " and ");
            }
            this.props.onMatchMessages(this.ruleIndex, sentMessages, receivedMessages, quantifierXPath, constraintXPath);
        }
    }


    /**
     * check validity of an xml and generate the xpath query
     * @param xmlText
     * @param sentMessageData
     * @returns string xpath
     * derived from the originalText
     */
    traverseReceivedXml(xmlText, sentMessageData) {
        const exprValidation = sentMessageData["query"];
        const parser = new DOMParser();

        function nsResolver(prefix) {
            const ns = {"src": "http://www.srcML.org/srcML/src"};
            return ns[prefix] || null;
        }

        // checks validity of the XML
        const xml = parser.parseFromString(xmlText, "text/xml");
        if (!xml.evaluate) {
            console.log("error in xml.evaluate");
            return "";
        }


        const validNodes = xml.evaluate(exprValidation, xml, nsResolver, XPathResult.ANY_TYPE, null);
        const resultValidNode = validNodes.iterateNext();
        if (!resultValidNode) {
            console.log("error: XPath is not valid.");
            return "";
        }

        /**
         * recursive function
         * traverse the state_children of a parent node to generate xpath query conditions
         * @param parentNode
         * @returns string
         */
        const traverseChildren = (parentNode) => {
            const res = [];
            const children = parentNode.childNodes;
            for (let i = 0; i < children.length; i++) {
                if (children[i].nodeName === "#text") {
                    if (children.length === 1) {
                        res.push(`text()='${children[i].nodeValue}'`);
                    }
                } else {
                    res.push(traverseChildren(children[i]));
                }
            }
            return "src:" + parentNode.nodeName + "[" + res.join(" and ") + "]";
        };

        // result xpath: 'src:expr[....]' where 'src:expr[' and the final ']' is extra.
        let resultXPath = traverseChildren(resultValidNode);
        resultXPath = resultXPath.substring(sentMessageData["cuttingLength"], resultXPath.length - 1);
        return resultXPath;
    }


    /**
     * process the error received by running verifyTextBasedOnGrammar on autoComplete text
     * @param error
     * @param errorIndex
     */
    processLanguageProcessingError(error, errorIndex = 400) {
        switch (error) {
            case "ERROR_INDEX":
                if (errorIndex === -1) {
                    this.setState({editorError: ""});
                } else {
                    this.setState({
                        editorError: {
                            errorType: "AutoComplete Error",
                            message: error_messages_IMarkdownString[errorIndex].value,
                            inputText: "",
                            alertType: "danger",
                        },
                    });
                }
                break;
            case "EMPTY_FIELD":
                this.setState({
                    editorError: {
                        errorType: "Empty Field",
                        message: "The design rule input should not be empty",
                        inputText: "",
                        alertType: "warning",
                    },
                });
                break;
            case "NO_INPUT_AFTER_REPLACING_PHRASES":
                this.setState({
                    editorError: {
                        errorType: "Incorrect Input",
                        message: "The used phrases are incorrect. Try using different phrases.",
                        inputText: "",
                        alertType: "danger",
                    },
                    errorPoint: 1,
                });
                break;
            case "NO_INPUT_AFTER_LEMMATIZATION":
                this.setState({
                    editorError: {
                        errorType: "Incorrect Input",
                        message: "The words used in the design rule are not compatible with CoreNLP library.",
                        inputText: "",
                        alertType: "danger",
                    },
                    errorPoint: 1,
                });
                break;
            /**
             * {grammarErrors: [{rec, sym, line, col, msg, e}]}
             * or
             * {xpathTraverseErrors: errorMessage}
             */
            default:
                if (error.grammarErrors) {
                    const grammarError = error.grammarErrors[0];
                    this.setState({
                        editorError: {
                            errorType: "Grammar Error",
                            message: "The input text after the following sub-text is NOT according to the grammar:",
                            inputText: `"${error.inputText.slice(0, grammarError.col)}"`,
                            alertType: "danger",
                        },
                        errorPoint: grammarError.col,
                    });
                } else {
                    this.setState({
                        editorError: {
                            errorType: "error",
                            message: "",
                            inputText: "",
                            alertType: "danger",
                        },
                        errorPoint: 1,
                    });
                }
                break;
        }
    }


    /**
     * change edit mode, set the states
     */
    changeEditMode() {
        this.props["changeEditMode"]();
    }

    updateFeedbackSnippet(quantifierXPath, constraintXPath, folderConstraint, filesFolders) {
        if (quantifierXPath === "" || constraintXPath === "" || folderConstraint === "" ||
            (folderConstraint === "INCLUDE" && filesFolders.filter((d) => d !== "").length === 0)) {
            return [];
        }

        let ruleInArray = [
            {
                index: "000",
                checkForFilesFoldersConstraints: folderConstraint,
                checkForFilesFolders: filesFolders.filter((d) => d !== ""),
                processFilesFolders: "WITHIN",
                quantifierXPathQuery: [quantifierXPath.startsWith("src:unit/") ? quantifierXPath : "src:unit/" + quantifierXPath],
                constraintXPathQuery: [constraintXPath.startsWith("src:unit/") ? constraintXPath : "src:unit/" + constraintXPath],
            },
        ];
        try {
            ruleInArray = checkRulesForAll(this.props.xmlFiles, ruleInArray);
            return ruleInArray[0].xPathQueryResult;
        } catch (e) {
            console.log(e);
            console.log("failed to evaluate the rule.");
            return [];
        }
    }

    /**
     * submit the updated rule (with the given Index)
     */
    onSubmitUpdatedRule() {
        const rule = {
            index: this.ruleIndex,
            title: this.state.title,
            description: this.state.description,
            tags: this.state.ruleTags,
            checkForFilesFoldersConstraints: this.state.folderConstraint,
            checkForFilesFolders: this.state.filesFolders.filter((d) => d !== ""),
            processFilesFolders: "WITHIN",
            quantifierXPathQuery: ["src:unit/" + this.state.quantifierXPath],
            constraintXPathQuery: ["src:unit/" + this.state.constraintXPath],
            grammar: this.ruleI.rulePanelState.autoCompleteArray.map((d) => d.text).join(" "),
        };

        if (this.props.numberOfSentMessages !== 0) {
            this.setState({
                errorTitle: "Error in Submitting the Rule",
                errorMessage: `Please wait for the server to respond to ${this.props.numberOfSentMessages} ` +
                    "sent messages. If the error appeared by mistake, reset the form by 'clear' button.",
                showError: true,
            });
            return;
        }

        if (!rule.index) {
            this.setState({
                errorTitle: "Error in Submitting the updated Rule",
                errorMessage: "Internal error.",
                showError: true,
            });
            return;
        }

        if (rule.title === "" || rule.description === "") {
            this.setState({
                errorTitle: "Error in Submitting the updated Rule",
                errorMessage: "Make sure to enter 'title' and 'description' for the rule.",
                showError: true,
            });
            return;
        }

        if (rule.checkForFilesFoldersConstraints === "" ||
            (rule.checkForFilesFoldersConstraints === "INCLUDE" && rule.checkForFilesFolders.length === 0)) {
            this.setState({
                errorTitle: "Error in Submitting the updated Rule",
                errorMessage: "Make sure to specify the folders/files on which the rule is applied on.",
                showError: true,
            });
            return;
        }

        if (this.state.quantifierXPath === "" || this.state.constraintXPath === "") {
            this.setState({
                errorTitle: "Error in Submitting the updated Rule",
                errorMessage: "Please specify a valid design rule.",
                showError: true,
            });
            return;
        }

        const isChanged = (rule.title !== this.ruleI.title) ||
            (rule.description !== this.ruleI.description) ||
            (JSON.stringify(rule.tags) !== JSON.stringify(this.ruleI.tags)) ||
            (rule.checkForFilesFoldersConstraints !== this.ruleI.checkForFilesFoldersConstraints) ||
            (JSON.stringify(rule.checkForFilesFolders) !== JSON.stringify(this.ruleI.checkForFilesFolders)) ||
            (rule.grammar !== this.ruleI.grammar) ||
            (rule.constraintXPathQuery[0] !== this.ruleI.constraintXPathQuery[0]) ||
            (rule.quantifierXPathQuery[0] !== this.ruleI.quantifierXPathQuery[0]);

        if (isChanged) {
            this.props.onUpdateRule();
            Utilities.sendToServer(this.props.ws, webSocketSendMessage.modified_rule_msg, rule);
        }
        this.changeEditMode();
    }

    /**
     * submit a new rule
     */
    onSubmitNewRule() {
        const rule = {
            index: Math.floor(new Date().getTime() / 1000).toString(),
            title: this.state.title,
            description: this.state.description,
            tags: this.state.ruleTags,
            checkForFilesFoldersConstraints: this.state.folderConstraint,
            checkForFilesFolders: this.state.filesFolders.filter((d) => d !== ""),
            processFilesFolders: "WITHIN",
            quantifierXPathQuery: ["src:unit/" + this.state.quantifierXPath],
            constraintXPathQuery: ["src:unit/" + this.state.constraintXPath],
            grammar: this.props.autoCompleteArray.map((d) => d.text).join(" "),
        };

        if (this.props.numberOfSentMessages !== 0) {
            this.setState({
                errorTitle: "Error in Submitting the new Rule",
                errorMessage: `Please wait for the server to respond to ${this.props.numberOfSentMessages} ` +
                    "sent messages for retrieving XPath. If the error appeared by mistake, reset the form by 'clear' button.",
                showError: true,
            });
            return;
        }

        if (rule.index === "" || rule.title === "" || rule.description === "") {
            this.setState({
                errorTitle: "Error in Submitting the new Rule",
                errorMessage: "Make sure to enter 'title' and 'description' for the rule.",
                showError: true,
            });
            return;
        }

        if (rule.checkForFilesFoldersConstraints === "" ||
            (rule.checkForFilesFoldersConstraints === "INCLUDE" && rule.checkForFilesFolders.length === 0)) {
            this.setState({
                errorTitle: "Error in Submitting the new Rule",
                errorMessage: "Make sure to specify the folders/files on which the rule is applied on.",
                showError: true,
            });
            return;
        }

        if (this.state.quantifierXPath === "" || this.state.constraintXPath === "") {
            this.setState({
                errorTitle: "Error in Submitting the new Rule",
                errorMessage: "Please specify a valid design rule.",
                showError: true,
            });
            return;
        }

        this.props.onSubmitNewRule();
        Utilities.sendToServer(this.props.ws, webSocketSendMessage.new_rule_msg, rule);
        this.changeEditMode();
    }

    /**
     * adding a new tag
     * In tagJson, the property is 'detail'
     */
    onSubmitNewTag() {
        if (this.state.tagName.indexOf(" ") !== -1 || this.state.tagName.indexOf("\t") !== -1) {
            this.setState({
                errorMessage: "The name of the tag should not include spaces or tabs",
                showError: true,
            });
            return;
        }
        if (this.state.tagName === "" || this.state.tagDetail === "") {
            this.setState({
                errorMessage: "Please specify non-empty name and description for the new tag.",
                showError: true,
            });
            return;
        }
        if (this.state.tags.filter((tag) => tag.tagName === this.state.tagName).length > 0) {
            this.setState({
                errorTitle: "Error in Submitting the new Tag",
                errorMessage: `"${this.state.tagName}" already exists with description "${this.state.tagDetail}'". 
                If the new tag is different, please select a different name.`,
                showError: true,
            });
            return;
        }

        const tag = {
            ID: Math.floor(new Date().getTime() / 10).toString(),
            tagName: this.state.tagName, detail: this.state.tagDetail,
        };
        this.props.onSubmitNewTag();
        Utilities.sendToServer(this.props.ws, webSocketSendMessage.new_tag_msg, tag);
        this.setState({showNewTagModal: false});
    }

    /** *
     * This function calls a dispatcher for redux
     * to update the content of the form in the main state
     */
    onEditNewRuleForm() {
        this.props.onEditForm(
            this.ruleIndex,
            this.state.title,
            this.state.description,
            this.state.ruleTags,
            this.state.folderConstraint,
            this.state.filesFolders,
        );
    }
}

function mapStateToProps(state) {
    return {
        rules: state.ruleTable,
        tags: state.tagTable,
        xmlFiles: state.xmlFiles,
        ws: state.ws,
        projectHierarchy: state.projectHierarchy,

        // for new rule
        title: state.rulePadState.title,
        description: state.rulePadState.description,
        ruleTags: state.rulePadState.ruleTags,
        folderConstraint: state.rulePadState.folderConstraint,
        filesFolders: state.rulePadState.filesFolders,

        autoCompleteArray: state.rulePadState.autoCompleteArray,
        quantifierXPath: state.rulePadState.quantifierXPath,
        constraintXPath: state.rulePadState.constraintXPath,
        message: state.message,

        sentMessages: state.sentXpathMessages,
        receivedMessages: state.receivedXpathMessages,
        // for submitting the rule
        numberOfSentMessages: state.sentXpathMessages.length,

        displayEditRuleTutorial: state.displayEditRuleTutorial,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onIgnoreFile: (shouldIgnore) => dispatch(ignoreFileChange(shouldIgnore)),
        onSubmitNewRule: () => dispatch(submitNewRule()),
        onUpdateRule: () => dispatch(updateRule()),
        onSubmitNewTag: () => dispatch(submitNewTag()),
        onClearForm: () => dispatch(clearNewRuleForm()),
        onEditForm: (ruleIndex, title, description, ruleTags, folderConstraint, filesFolders) =>
            dispatch(editRuleForm(ruleIndex, title, description, ruleTags, folderConstraint, filesFolders)),
        onReceiveGuiTree: (ruleIndex, treeData, autoCompleteArray, quantifierXPath, constraintXPath) =>
            dispatch(receiveGuiTree(ruleIndex, treeData, autoCompleteArray, quantifierXPath, constraintXPath)),
        onMatchMessages: (ruleIndex, sentMessages, receivedMessages, quantifierXPath, constraintXPath) =>
            dispatch(matchMessages(ruleIndex, sentMessages, receivedMessages, quantifierXPath, constraintXPath)),
        onUpdateXPaths: (ruleIndex, quantifierXPath, constraintXPath) =>
            dispatch(updateXPaths(ruleIndex, quantifierXPath, constraintXPath)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(RulePad);


/* custom dropdown for tags */

class CustomDropDown extends Component {
    constructor(props) {
        super(props);

        if (!props.menuItems || !props.onSelectFunction) {
            return new Error("'menuItems' and 'onSelectFunction' are required in props");
        }

        this.state = {
            menuItems: props.menuItems,
            onSelectFunction: props.onSelectFunction,
            id: props.id ? props.id : "dropdown-custom-menu",
            open: false,
        };
    }

    render() {
        return (
            <RootCloseWrapper onRootClose={() => this.setState({open: false})}>
                <Dropdown id={this.state.id} open={this.state.open}
                    onToggle={() => this.setState({open: !this.state.open})}>
                    <CustomToggle bsRole="toggle">
                        <span className={"faTag"} data-tip={"React-tooltip"} data-for={"tags"}>Assign Tags
                            <FaTag size={25} className={"faTag react-icons"} />
                        </span>
                        <ReactToolTip place={"top"} type={"dark"} effect={"solid"} id={"tags"} delayShow={300}>
                            <span>{"Use tags to organize rules."}</span>
                        </ReactToolTip>
                    </CustomToggle>
                    <CustomMenu bsRole="menu">
                        {this.state.menuItems.map((el, i) =>
                        (<MenuItem eventKey={el} key={i}
                            onSelect={this.state.onSelectFunction}
                        >{(() => el !== "New Tag" ? el :
                            <Fragment><MdAddBox size={20} className={"mdAddBox react-icons"} /> {el}</Fragment>)()}
                        </MenuItem>),
                        )}
                    </CustomMenu>
                </Dropdown>
            </RootCloseWrapper>
        );
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.setState({
            menuItems: nextProps.menuItems,
            onSelectFunction: nextProps.onSelectFunction,
            id: nextProps.id ? nextProps.id : "dropdown-custom-menu",
        });
    }
}

class CustomMenu extends Component {
    render() {
        const {children} = this.props;
        return (<div className="dropdown-menu">{React.Children.toArray(children)}</div>);
    }
}

class CustomToggle extends Component {
    constructor(props, context) {
        super(props, context);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        e.preventDefault();
        this.props.onClick(e);
    }

    render() {
        // eslint-disable-next-line
        return (<a href="" onClick={this.handleClick}>{this.props.children}</a>);
    }
}
